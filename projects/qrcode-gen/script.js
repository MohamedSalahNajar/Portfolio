// ===========================
// État de l'application
// ===========================

let instanceQR     = null;  // instance QRCode.js en cours
let tailleActuelle = 200;   // taille du QR en pixels
let typeActuel     = 'url'; // type de contenu sélectionné
let timerDelai     = null;  // pour éviter de régénérer à chaque frappe


// ===========================
// Configuration par type de contenu
// ===========================

const configTypes = {
  url: {
    label      : 'URL à encoder',
    placeholder: 'https://exemple.com',
    inputType  : 'url',
    prefixer   : function (val) {
      // Ajouter https:// si l'utilisateur a oublié le protocole
      if (val && !val.startsWith('http://') && !val.startsWith('https://')) {
        return 'https://' + val;
      }
      return val;
    }
  },
  texte: {
    label      : 'Texte à encoder',
    placeholder: 'Entrez votre texte ici...',
    inputType  : 'text',
    prefixer   : function (val) { return val; }
  },
  email: {
    label      : 'Adresse email',
    placeholder: 'exemple@gmail.com',
    inputType  : 'email',
    prefixer   : function (val) {
      return val ? 'mailto:' + val : '';
    }
  },
  tel: {
    label      : 'Numéro de téléphone',
    placeholder: '+33 6 12 34 56 78',
    inputType  : 'tel',
    prefixer   : function (val) {
      return val ? 'tel:' + val.replace(/\s/g, '') : '';
    }
  }
};


// ===========================
// Initialisation
// ===========================

document.addEventListener('DOMContentLoaded', function () {
  // Synchroniser les affichages hex des couleurs au démarrage
  mettreAJourHex('couleur-principale', 'hex-principale');
  mettreAJourHex('couleur-fond', 'hex-fond');
});


// ===========================
// Changer le type de contenu (onglets)
// ===========================

function changerType(bouton) {
  // Mettre à jour l'onglet actif
  document.querySelectorAll('.onglet').forEach(b => b.classList.remove('actif'));
  bouton.classList.add('actif');

  typeActuel = bouton.dataset.type;
  const config = configTypes[typeActuel];

  // Mettre à jour le champ de saisie
  const champ = document.getElementById('saisie-principale');
  champ.setAttribute('type', config.inputType);
  champ.setAttribute('placeholder', config.placeholder);
  champ.value = '';

  document.getElementById('label-saisie').textContent = config.label;

  // Vider le QR précédent
  viderQR();
}


// ===========================
// Générer le QR code (avec délai anti-rebond)
// ===========================

function genererQR() {
  // Mettre à jour les affichages hex des couleurs en temps réel
  mettreAJourHex('couleur-principale', 'hex-principale');
  mettreAJourHex('couleur-fond', 'hex-fond');

  // Délai de 300ms pour ne pas régénérer à chaque caractère tapé
  clearTimeout(timerDelai);
  timerDelai = setTimeout(function () {
    _genererQR();
  }, 300);
}

function _genererQR() {
  const valeurBrute  = document.getElementById('saisie-principale').value.trim();
  const config       = configTypes[typeActuel];
  const contenu      = config.prefixer(valeurBrute);

  // Ne rien générer si le champ est vide
  if (!contenu) {
    viderQR();
    return;
  }

  const couleurQR    = document.getElementById('couleur-principale').value;
  const couleurFond  = document.getElementById('couleur-fond').value;
  const correction   = document.getElementById('correction').value;
  const conteneur    = document.getElementById('conteneur-qr');
  const placeholder  = document.getElementById('placeholder-qr');
  const zoneApercu   = document.getElementById('zone-apercu');

  // Vider le conteneur avant de générer un nouveau QR
  conteneur.innerHTML = '';

  // Cacher le placeholder, montrer la zone QR
  placeholder.style.display = 'none';
  zoneApercu.classList.add('a-qr');

  // Générer avec QRCode.js
  instanceQR = new QRCode(conteneur, {
    text          : contenu,
    width         : tailleActuelle,
    height        : tailleActuelle,
    colorDark     : couleurQR,
    colorLight    : couleurFond,
    correctLevel  : QRCode.CorrectLevel[correction]
  });

  // Animer l'apparition
  const canvas = conteneur.querySelector('canvas') || conteneur.querySelector('img');
  if (canvas) {
    canvas.classList.add('qr-anime');
  }

  // Afficher les boutons de téléchargement
  document.getElementById('boutons-telechargement').style.display = 'flex';

  // Afficher l'info taille
  document.getElementById('info-taille').textContent =
    tailleActuelle + ' × ' + tailleActuelle + ' px · ' + correction + ' correction';
}


// ===========================
// Vider la zone QR
// ===========================

function viderQR() {
  document.getElementById('conteneur-qr').innerHTML = '';
  document.getElementById('placeholder-qr').style.display = 'block';
  document.getElementById('zone-apercu').classList.remove('a-qr');
  document.getElementById('boutons-telechargement').style.display = 'none';
  document.getElementById('info-taille').textContent = '';
  instanceQR = null;
}


// ===========================
// Mettre à jour la taille (slider)
// ===========================

function mettreAJourTaille(valeur) {
  tailleActuelle = parseInt(valeur);
  document.getElementById('valeur-taille').textContent = tailleActuelle;

  // Régénérer si un QR est déjà affiché
  const valeurBrute = document.getElementById('saisie-principale').value.trim();
  if (valeurBrute) {
    _genererQR();
  }
}


// ===========================
// Afficher la valeur hex d'un input couleur
// ===========================

function mettreAJourHex(idInput, idSpan) {
  const valeur = document.getElementById(idInput).value;
  document.getElementById(idSpan).textContent = valeur;
}


// ===========================
// Télécharger le QR code
// ===========================

function telecharger(format) {
  const conteneur = document.getElementById('conteneur-qr');

  if (format === 'png') {
    // Récupérer le canvas généré par QRCode.js
    const canvas = conteneur.querySelector('canvas');

    if (canvas) {
      // Créer un lien de téléchargement temporaire
      const lien = document.createElement('a');
      lien.download = 'qrcode-msn.png';
      lien.href = canvas.toDataURL('image/png');
      lien.click();
    } else {
      // QRCode.js peut aussi générer une image (fallback)
      const img = conteneur.querySelector('img');
      if (img) {
        const lien = document.createElement('a');
        lien.download = 'qrcode-msn.png';
        lien.href = img.src;
        lien.click();
      }
    }

  } else if (format === 'svg') {
    // Générer manuellement un SVG simple à partir du canvas
    const canvas = conteneur.querySelector('canvas');
    if (!canvas) return;

    const taille = tailleActuelle;
    const couleurQR   = document.getElementById('couleur-principale').value;
    const couleurFond = document.getElementById('couleur-fond').value;

    // Lire les pixels du canvas pour reproduire le QR en SVG
    const ctx = canvas.getContext('2d');
    const donnees = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = donnees.data;
    const largeurCanvas = canvas.width;
    const taillePixel = taille / largeurCanvas;

    let rectsSVG = '';

    for (let y = 0; y < largeurCanvas; y++) {
      for (let x = 0; x < largeurCanvas; x++) {
        const index = (y * largeurCanvas + x) * 4;
        const r = pixels[index];
        const g = pixels[index + 1];
        const b = pixels[index + 2];

        // Si le pixel est foncé → c'est un module QR (carré noir)
        if (r < 128 && g < 128 && b < 128) {
          rectsSVG += `<rect x="${x * taillePixel}" y="${y * taillePixel}" width="${taillePixel}" height="${taillePixel}" fill="${couleurQR}"/>`;
        }
      }
    }

    const svgContenu = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${taille}" height="${taille}" viewBox="0 0 ${taille} ${taille}">
  <rect width="${taille}" height="${taille}" fill="${couleurFond}"/>
  ${rectsSVG}
</svg>`;

    // Créer et déclencher le téléchargement
    const blob = new Blob([svgContenu], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    const lien = document.createElement('a');
    lien.download = 'qrcode-msn.svg';
    lien.href = url;
    lien.click();

    // Libérer la mémoire
    URL.revokeObjectURL(url);
  }
}
