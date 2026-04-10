// ===========================
// État de l'application
// ===========================

let taches = [];           // tableau de toutes les tâches
let filtreActif = 'toutes'; // filtre courant : 'toutes' | 'actives' | 'terminees'


// ===========================
// Initialisation au chargement
// ===========================

document.addEventListener('DOMContentLoaded', function () {
  chargerDepuisLocalStorage();
  rendreListe();

  // Ajouter une tâche en appuyant sur Entrée
  document.getElementById('champ-tache').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') ajouterTache();
  });
});


// ===========================
// Ajouter une nouvelle tâche
// ===========================

function ajouterTache() {
  const champ = document.getElementById('champ-tache');
  const texte = champ.value.trim();

  // On n'ajoute pas une tâche vide
  if (texte === '') {
    champ.focus();
    return;
  }

  // Création de l'objet tâche
  const nouvelleTache = {
    id: Date.now(),          // identifiant unique basé sur l'horodatage
    texte: texte,
    terminee: false,
    dateCreation: new Date().toLocaleDateString('fr-FR')
  };

  taches.push(nouvelleTache);
  champ.value = '';
  champ.focus();

  sauvegarderDansLocalStorage();
  rendreListe();
}


// ===========================
// Basculer l'état terminé / actif
// ===========================

function basculerTache(id) {
  const tache = taches.find(t => t.id === id);
  if (!tache) return;

  tache.terminee = !tache.terminee;
  sauvegarderDansLocalStorage();
  rendreListe();
}


// ===========================
// Supprimer une tâche (avec animation)
// ===========================

function supprimerTache(id) {
  const element = document.querySelector(`[data-id="${id}"]`);

  if (element) {
    // On déclenche l'animation avant de retirer du tableau
    element.classList.add('suppression');
    setTimeout(function () {
      taches = taches.filter(t => t.id !== id);
      sauvegarderDansLocalStorage();
      rendreListe();
    }, 220);
  } else {
    taches = taches.filter(t => t.id !== id);
    sauvegarderDansLocalStorage();
    rendreListe();
  }
}


// ===========================
// Modifier le texte d'une tâche (double-clic)
// ===========================

function activerEdition(id) {
  const tache = taches.find(t => t.id === id);
  if (!tache || tache.terminee) return;

  const elementTexte = document.querySelector(`[data-id="${id}"] .texte-tache`);
  if (!elementTexte) return;

  elementTexte.setAttribute('contenteditable', 'true');
  elementTexte.focus();

  // Placer le curseur à la fin du texte
  const range = document.createRange();
  const selection = window.getSelection();
  range.selectNodeContents(elementTexte);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);

  // Sauvegarder quand on quitte le champ
  elementTexte.addEventListener('blur', function sauvegarderEdition() {
    const nouveauTexte = elementTexte.textContent.trim();
    if (nouveauTexte !== '') {
      tache.texte = nouveauTexte;
    } else {
      elementTexte.textContent = tache.texte; // on remet l'ancien texte si vide
    }
    elementTexte.setAttribute('contenteditable', 'false');
    sauvegarderDansLocalStorage();
    elementTexte.removeEventListener('blur', sauvegarderEdition);
  }, { once: true });

  // Valider aussi avec Entrée
  elementTexte.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      elementTexte.blur();
    }
    if (e.key === 'Escape') {
      elementTexte.textContent = tache.texte;
      elementTexte.blur();
    }
  });
}


// ===========================
// Changer le filtre actif
// ===========================

function changerFiltre(bouton) {
  // Mettre à jour le bouton actif visuellement
  document.querySelectorAll('.filtre').forEach(b => b.classList.remove('actif'));
  bouton.classList.add('actif');

  filtreActif = bouton.dataset.filtre;
  rendreListe();
}


// ===========================
// Supprimer toutes les tâches terminées
// ===========================

function supprimerTerminees() {
  taches = taches.filter(t => !t.terminee);
  sauvegarderDansLocalStorage();
  rendreListe();
}


// ===========================
// Rendre / afficher la liste selon le filtre
// ===========================

function rendreListe() {
  const liste   = document.getElementById('liste-taches');
  const msgVide = document.getElementById('liste-vide');

  // Filtrer les tâches selon le filtre actif
  let tachesFiltrees;
  if (filtreActif === 'actives') {
    tachesFiltrees = taches.filter(t => !t.terminee);
  } else if (filtreActif === 'terminees') {
    tachesFiltrees = taches.filter(t => t.terminee);
  } else {
    tachesFiltrees = taches;
  }

  // Vider la liste actuelle
  liste.innerHTML = '';

  // Afficher le message si aucune tâche
  if (tachesFiltrees.length === 0) {
    msgVide.classList.add('visible');
  } else {
    msgVide.classList.remove('visible');

    // Créer chaque élément de tâche
    tachesFiltrees.forEach(function (tache) {
      const li = document.createElement('li');
      li.className = 'tache' + (tache.terminee ? ' terminee' : '');
      li.dataset.id = tache.id;

      li.innerHTML = `
        <div class="checkbox-custom" onclick="basculerTache(${tache.id})">
          ${tache.terminee ? '✓' : ''}
        </div>
        <span class="texte-tache" ondblclick="activerEdition(${tache.id})">${echapper(tache.texte)}</span>
        <button class="btn-supprimer" onclick="supprimerTache(${tache.id})" title="Supprimer">✕</button>
      `;

      liste.appendChild(li);
    });
  }

  // Mettre à jour le compteur
  mettreAJourCompteur();
}


// ===========================
// Mettre à jour le texte du compteur
// ===========================

function mettreAJourCompteur() {
  const actives = taches.filter(t => !t.terminee).length;
  const texte = document.getElementById('texte-compteur');

  if (actives === 0) {
    texte.textContent = 'Toutes les tâches sont terminées !';
  } else if (actives === 1) {
    texte.textContent = '1 tâche restante';
  } else {
    texte.textContent = `${actives} tâches restantes`;
  }
}


// ===========================
// Persistance : localStorage
// ===========================

function sauvegarderDansLocalStorage() {
  localStorage.setItem('msn-todo-taches', JSON.stringify(taches));
}

function chargerDepuisLocalStorage() {
  const donnees = localStorage.getItem('msn-todo-taches');
  if (donnees) {
    try {
      taches = JSON.parse(donnees);
    } catch (e) {
      // Si les données sont corrompues, on repart de zéro
      taches = [];
    }
  }
}


// ===========================
// Sécurité : échapper le HTML pour éviter les injections XSS
// ===========================

function echapper(texte) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(texte));
  return div.innerHTML;
}
