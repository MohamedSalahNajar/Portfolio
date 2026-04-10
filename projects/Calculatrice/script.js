// ===========================
// Variables d'état
// ===========================

let expressionActuelle = '';   // ce que l'utilisateur a tapé
let afficheResultat = false;   // true si on vient d'appuyer sur =

// Références vers les éléments HTML
const affichageExpression = document.getElementById('expression');
const affichageResultat   = document.getElementById('resultat');


// ===========================
// Mise à jour de l'écran
// ===========================

function mettreAJourEcran() {
  affichageExpression.textContent = formaterExpression(expressionActuelle);
  affichageResultat.textContent   = affichageResultat.textContent; // on ne touche pas au résultat ici

  // Ajuster la taille de la police selon la longueur
  const longueur = affichageResultat.textContent.length;
  affichageResultat.classList.remove('long', 'tres-long');
  if (longueur > 14) {
    affichageResultat.classList.add('tres-long');
  } else if (longueur > 9) {
    affichageResultat.classList.add('long');
  }
}

// Remplace les symboles internes par des symboles lisibles
function formaterExpression(expr) {
  return expr
    .replace(/\*/g, '×')
    .replace(/\//g, '÷');
}


// ===========================
// Ajouter un chiffre ou un opérateur
// ===========================

function ajouterSymbole(symbole) {
  const operateurs = ['+', '-', '*', '/'];
  const dernierCaractere = expressionActuelle.slice(-1);

  // Si on vient d'afficher un résultat et qu'on appuie sur un chiffre → on repart de zéro
  if (afficheResultat) {
    if (!operateurs.includes(symbole)) {
      expressionActuelle = '';
    }
    afficheResultat = false;
  }

  // On ne commence pas par un opérateur (sauf le moins pour les négatifs, à améliorer plus tard)
  if (expressionActuelle === '' && operateurs.includes(symbole) && symbole !== '-') {
    return;
  }

  // On ne met pas deux opérateurs consécutifs
  if (operateurs.includes(symbole) && operateurs.includes(dernierCaractere)) {
    expressionActuelle = expressionActuelle.slice(0, -1);
  }

  // Limite de longueur pour éviter les débordements
  if (expressionActuelle.length >= 20) return;

  expressionActuelle += symbole;

  // Mise à jour de l'affichage en direct
  affichageExpression.textContent = formaterExpression(expressionActuelle);
  affichageResultat.textContent   = formaterExpression(expressionActuelle);

  // Ajuster taille police
  const longueur = affichageResultat.textContent.length;
  affichageResultat.classList.remove('long', 'tres-long');
  if (longueur > 14) {
    affichageResultat.classList.add('tres-long');
  } else if (longueur > 9) {
    affichageResultat.classList.add('long');
  }
}


// ===========================
// Ajouter une virgule (point décimal)
// ===========================

function ajouterVirgule() {
  if (afficheResultat) {
    expressionActuelle = '0';
    afficheResultat = false;
  }

  // On récupère le dernier nombre en cours de saisie
  const parties = expressionActuelle.split(/[\+\-\*\/]/);
  const dernierNombre = parties[parties.length - 1];

  // On n'ajoute pas de deuxième point au même nombre
  if (dernierNombre.includes('.')) return;

  // Si l'expression est vide ou se termine par un opérateur, on commence par "0."
  if (expressionActuelle === '' || ['+', '-', '*', '/'].includes(expressionActuelle.slice(-1))) {
    expressionActuelle += '0';
  }

  expressionActuelle += '.';
  affichageExpression.textContent = formaterExpression(expressionActuelle);
  affichageResultat.textContent   = formaterExpression(expressionActuelle);
}


// ===========================
// Calculer le résultat
// ===========================

function calculer() {
  if (expressionActuelle === '') return;

  // Sauvegarder l'expression pour l'afficher en petit
  const expressionAffichee = formaterExpression(expressionActuelle);

  try {
    // On utilise eval() pour évaluer l'expression mathématique
    // (c'est suffisant pour un projet scolaire)
    let resultat = eval(expressionActuelle);

    // Gérer la division par zéro
    if (!isFinite(resultat)) {
      afficherErreur('Erreur : div/0');
      return;
    }

    // Arrondir les flottants longs (ex: 0.1 + 0.2 = 0.30000000004)
    resultat = parseFloat(resultat.toFixed(10));

    // Affichage : expression en petit, résultat en grand
    affichageExpression.textContent = expressionAffichee + ' =';
    affichageResultat.textContent   = resultat;

    // Ajuster la taille de la police
    const longueur = String(resultat).length;
    affichageResultat.classList.remove('long', 'tres-long');
    if (longueur > 14) {
      affichageResultat.classList.add('tres-long');
    } else if (longueur > 9) {
      affichageResultat.classList.add('long');
    }

    // On mémorise le résultat pour continuer le calcul si besoin
    expressionActuelle = String(resultat);
    afficheResultat    = true;

  } catch (e) {
    afficherErreur('Erreur');
  }
}


// ===========================
// Effacer tout (AC)
// ===========================

function effacerTout() {
  expressionActuelle = '';
  afficheResultat    = false;

  affichageExpression.textContent = '';
  affichageResultat.textContent   = '0';
  affichageResultat.classList.remove('long', 'tres-long');
}


// ===========================
// Effacer le dernier caractère (⌫)
// ===========================

function effacerDernier() {
  if (afficheResultat) {
    effacerTout();
    return;
  }

  expressionActuelle = expressionActuelle.slice(0, -1);

  if (expressionActuelle === '') {
    affichageResultat.textContent = '0';
  } else {
    affichageResultat.textContent = formaterExpression(expressionActuelle);
  }

  affichageExpression.textContent = '';

  // Ajuster la taille
  const longueur = affichageResultat.textContent.length;
  affichageResultat.classList.remove('long', 'tres-long');
  if (longueur > 14) {
    affichageResultat.classList.add('tres-long');
  } else if (longueur > 9) {
    affichageResultat.classList.add('long');
  }
}


// ===========================
// Changer le signe du nombre affiché (+/-)
// ===========================

function changerSigne() {
  if (expressionActuelle === '' || expressionActuelle === '0') return;

  // Si le résultat vient d'être calculé, on inverse simplement
  if (afficheResultat) {
    expressionActuelle = String(parseFloat(expressionActuelle) * -1);
    affichageResultat.textContent   = expressionActuelle;
    affichageExpression.textContent = '';
    return;
  }

  // Sinon on cherche le dernier nombre dans l'expression et on l'inverse
  const operateurs = ['+', '-', '*', '/'];
  let dernierOp = -1;

  for (let i = expressionActuelle.length - 1; i >= 0; i--) {
    if (operateurs.includes(expressionActuelle[i]) && i > 0) {
      dernierOp = i;
      break;
    }
  }

  if (dernierOp === -1) {
    // Toute l'expression est un seul nombre
    if (expressionActuelle.startsWith('-')) {
      expressionActuelle = expressionActuelle.slice(1);
    } else {
      expressionActuelle = '-' + expressionActuelle;
    }
  } else {
    // On inverse le dernier nombre uniquement
    const debut  = expressionActuelle.slice(0, dernierOp + 1);
    const fin    = expressionActuelle.slice(dernierOp + 1);
    if (fin.startsWith('-')) {
      expressionActuelle = debut + fin.slice(1);
    } else {
      expressionActuelle = debut + '-' + fin;
    }
  }

  affichageResultat.textContent   = formaterExpression(expressionActuelle);
  affichageExpression.textContent = '';
}


// ===========================
// Afficher une erreur (animation)
// ===========================

function afficherErreur(message) {
  affichageResultat.textContent   = message;
  affichageExpression.textContent = '';
  expressionActuelle = '';
  afficheResultat    = false;

  // Petite animation de secousse pour indiquer l'erreur
  const ecran = document.querySelector('.ecran');
  ecran.classList.add('erreur');
  setTimeout(() => ecran.classList.remove('erreur'), 400);
}


// ===========================
// Support clavier
// ===========================

document.addEventListener('keydown', function(e) {
  const chiffresEtOperateurs = ['0','1','2','3','4','5','6','7','8','9','+','-','*','/'];

  if (chiffresEtOperateurs.includes(e.key)) {
    ajouterSymbole(e.key);
  } else if (e.key === 'Enter' || e.key === '=') {
    calculer();
  } else if (e.key === 'Backspace') {
    effacerDernier();
  } else if (e.key === 'Escape') {
    effacerTout();
  } else if (e.key === '.') {
    ajouterVirgule();
  } else if (e.key === '%') {
    ajouterSymbole('%');
  }
});
