// ===========================
// Base de données des citations
// ===========================

const citations = [
  // --- Motivation ---
  {
    texte: "Le seul moyen de faire du bon travail est d'aimer ce que l'on fait.",
    auteur: "Steve Jobs",
    categorie: "Motivation"
  },
  {
    texte: "La réussite, c'est tomber sept fois et se relever huit.",
    auteur: "Proverbe japonais",
    categorie: "Motivation"
  },
  {
    texte: "Ne comptez pas les jours, faites que les jours comptent.",
    auteur: "Muhammad Ali",
    categorie: "Motivation"
  },
  {
    texte: "Le succès n'est pas final, l'échec n'est pas fatal. C'est le courage de continuer qui compte.",
    auteur: "Winston Churchill",
    categorie: "Motivation"
  },

  // --- Philosophie ---
  {
    texte: "Je pense, donc je suis.",
    auteur: "René Descartes",
    categorie: "Philosophie"
  },
  {
    texte: "La vie non examinée ne vaut pas la peine d'être vécue.",
    auteur: "Socrate",
    categorie: "Philosophie"
  },
  {
    texte: "L'homme est condamné à être libre.",
    auteur: "Jean-Paul Sartre",
    categorie: "Philosophie"
  },
  {
    texte: "On ne naît pas femme, on le devient.",
    auteur: "Simone de Beauvoir",
    categorie: "Philosophie"
  },

  // --- Science ---
  {
    texte: "L'imagination est plus importante que la connaissance.",
    auteur: "Albert Einstein",
    categorie: "Science"
  },
  {
    texte: "Si j'ai vu plus loin, c'est en me tenant sur les épaules de géants.",
    auteur: "Isaac Newton",
    categorie: "Science"
  },
  {
    texte: "La science sans conscience n'est que ruine de l'âme.",
    auteur: "François Rabelais",
    categorie: "Science"
  },
  {
    texte: "Le doute est le commencement de la sagesse.",
    auteur: "René Descartes",
    categorie: "Science"
  },

  // --- Sagesse ---
  {
    texte: "Connais-toi toi-même.",
    auteur: "Socrate",
    categorie: "Sagesse"
  },
  {
    texte: "Le bonheur est un chemin, pas une destination.",
    auteur: "Bouddha",
    categorie: "Sagesse"
  },
  {
    texte: "Ce que nous sommes est le résultat de ce que nous avons pensé.",
    auteur: "Bouddha",
    categorie: "Sagesse"
  },
  {
    texte: "Vis comme si tu devais mourir demain. Apprends comme si tu devais vivre toujours.",
    auteur: "Mahatma Gandhi",
    categorie: "Sagesse"
  },

  // --- Créativité ---
  {
    texte: "La créativité, c'est l'intelligence qui s'amuse.",
    auteur: "Albert Einstein",
    categorie: "Créativité"
  },
  {
    texte: "Toute grande réalisation était autrefois impossible.",
    auteur: "Bruce Lee",
    categorie: "Créativité"
  },
  {
    texte: "L'art, c'est la vie qui se mord la queue.",
    auteur: "Jean Cocteau",
    categorie: "Créativité"
  },
  {
    texte: "Le génie, c'est un pour cent d'inspiration et quatre-vingt-dix-neuf pour cent de transpiration.",
    auteur: "Thomas Edison",
    categorie: "Créativité"
  }
];


// ===========================
// État de l'application
// ===========================

let citationsFiltrees = [...citations]; // citations selon la catégorie sélectionnée
let indexActuel       = 0;             // index de la citation affichée
let enAnimation       = false;         // évite de déclencher plusieurs animations en même temps


// ===========================
// Initialisation au chargement
// ===========================

document.addEventListener('DOMContentLoaded', function () {
  // Mélanger les citations au départ pour plus de variété
  melangerTableau(citationsFiltrees);
  afficherCitation(citationsFiltrees[0]);
  mettreAJourCompteur();

  // Support clavier : flèche droite ou espace = nouvelle citation
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      nouvelleCitation();
    }
  });

  // Créer la notification de copie (ajoutée dynamiquement)
  const notif = document.createElement('div');
  notif.className = 'notif-copie';
  notif.id = 'notif-copie';
  notif.textContent = '✓ Citation copiée !';
  document.body.appendChild(notif);
});


// ===========================
// Afficher une citation donnée
// ===========================

function afficherCitation(citation) {
  document.getElementById('texte-citation').textContent  = citation.texte;
  document.getElementById('auteur-citation').textContent = '— ' + citation.auteur;
  document.getElementById('badge-categorie').textContent = citation.categorie;
}


// ===========================
// Passer à une nouvelle citation aléatoire
// ===========================

function nouvelleCitation() {
  if (enAnimation || citationsFiltrees.length === 0) return;
  enAnimation = true;

  const carte = document.getElementById('carte-citation');

  // Animation de sortie
  carte.classList.add('fondu-sortie');

  setTimeout(function () {
    carte.classList.remove('fondu-sortie');

    // Passer à l'index suivant (boucle sur le tableau)
    indexActuel = (indexActuel + 1) % citationsFiltrees.length;

    // Si on a fait le tour complet, on remélange
    if (indexActuel === 0) {
      melangerTableau(citationsFiltrees);
    }

    afficherCitation(citationsFiltrees[indexActuel]);
    mettreAJourCompteur();

    // Animation d'entrée
    carte.classList.add('fondu-entree');

    setTimeout(function () {
      carte.classList.remove('fondu-entree');
      enAnimation = false;
    }, 300);

  }, 200);
}


// ===========================
// Filtrer par catégorie
// ===========================

function filtrerCategorie() {
  const categorie = document.getElementById('select-categorie').value;

  if (categorie === 'toutes') {
    citationsFiltrees = [...citations];
  } else {
    citationsFiltrees = citations.filter(c => c.categorie === categorie);
  }

  // Mélanger et repartir du début
  melangerTableau(citationsFiltrees);
  indexActuel = 0;

  if (citationsFiltrees.length > 0) {
    afficherCitation(citationsFiltrees[0]);
  }

  mettreAJourCompteur();
}


// ===========================
// Copier la citation dans le presse-papiers
// ===========================

function copierCitation() {
  const texte  = document.getElementById('texte-citation').textContent;
  const auteur = document.getElementById('auteur-citation').textContent;
  const contenu = `"${texte}" ${auteur}`;

  // Utilisation de l'API Clipboard (navigateurs modernes)
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(contenu).then(function () {
      afficherNotifCopie();
    }).catch(function () {
      copierAncienneMethode(contenu);
    });
  } else {
    // Méthode alternative pour les anciens navigateurs
    copierAncienneMethode(contenu);
  }
}

function copierAncienneMethode(texte) {
  const zone = document.createElement('textarea');
  zone.value = texte;
  zone.style.position = 'fixed';
  zone.style.opacity  = '0';
  document.body.appendChild(zone);
  zone.select();
  document.execCommand('copy');
  document.body.removeChild(zone);
  afficherNotifCopie();
}

function afficherNotifCopie() {
  const notif = document.getElementById('notif-copie');
  notif.classList.add('visible');

  setTimeout(function () {
    notif.classList.remove('visible');
  }, 2000);
}


// ===========================
// Partager sur Twitter / X
// ===========================

function partagerTwitter() {
  const texte  = document.getElementById('texte-citation').textContent;
  const auteur = document.getElementById('auteur-citation').textContent;
  const contenu = encodeURIComponent(`"${texte}" ${auteur}`);
  const url = `https://twitter.com/intent/tweet?text=${contenu}`;

  window.open(url, '_blank');
}


// ===========================
// Mettre à jour le compteur
// ===========================

function mettreAJourCompteur() {
  const total = citationsFiltrees.length;
  const actuelle = total === 0 ? 0 : indexActuel + 1;
  document.getElementById('compteur-vues').textContent = `Citation ${actuelle} sur ${total}`;
}


// ===========================
// Mélanger un tableau (algorithme Fisher-Yates)
// ===========================

function melangerTableau(tableau) {
  for (let i = tableau.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tableau[i], tableau[j]] = [tableau[j], tableau[i]];
  }
}
