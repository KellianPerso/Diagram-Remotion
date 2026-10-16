import {SeqSpec} from '../../lib/Sequence';
import {C} from '../../lib/theme';

export const sequenceConnexion: SeqSpec = {
  id: 'Exemple-2-Sequence-Connexion',
  brand: 'Mon projet',
  title: 'Connexion et appel authentifié',
  subtitle: "Le navigateur obtient un jeton JWT, puis l'envoie à chaque appel d'API",
  tag: 'EXEMPLE · SÉQUENCE',
  source: 'Exemple fourni avec remotion-diagrams · src/diagrams/exemples/sequence-connexion.ts',
  rowH: 48, // hauteur d'une ligne de message
  top: 290, // ordonnée du premier message
  left: 200, // abscisse du premier participant
  right: 1640, // abscisse du dernier participant
  participants: [
    {id: 'nav', title: 'Navigateur', tech: 'React', icon: 'si:react'},
    {id: 'api', title: 'API', tech: 'FastAPI', icon: 'si:fastapi'},
    {id: 'db', title: 'Base de données', tech: 'PostgreSQL', icon: 'si:postgresql'},
    {id: 'cache', title: 'Cache', tech: 'Redis', icon: 'si:redis'},
  ],
  items: [
    {kind: 'msg', from: 'nav', to: 'api', label: 'POST /auth/login  {email, mot de passe}', num: 1},
    {kind: 'msg', from: 'api', to: 'db', label: 'SELECT utilisateur WHERE email = …', num: 2, color: C.database},
    {kind: 'msg', from: 'db', to: 'api', label: 'hash du mot de passe, rôle', reply: true},
    {kind: 'self', on: 'api', label: 'vérifie le hash (argon2), signe un JWT (15 min)', num: 3},
    {kind: 'frame', label: 'alt', cond: 'identifiants valides', over: ['nav', 'api']},
    {kind: 'msg', from: 'api', to: 'nav', label: '200  {access_token}', reply: true, color: C.ok},
    {kind: 'else', cond: 'identifiants invalides'},
    {kind: 'msg', from: 'api', to: 'nav', label: '401  (message générique)', reply: true, color: C.err},
    {kind: 'end'},
    {kind: 'msg', from: 'nav', to: 'api', label: 'GET /items  Authorization: Bearer <jeton>', num: 4},
    {kind: 'msg', from: 'api', to: 'cache', label: 'GET items:<utilisateur>', num: 5, color: C.compute},
    {kind: 'note', over: ['cache'], text: 'Absent du cache : lecture en base\npuis mise en cache 60 s', tone: 'info'},
    {kind: 'msg', from: 'api', to: 'nav', label: '200  [items]', reply: true},
  ],
  captions: [
    {step: 0, text: "Le navigateur envoie les identifiants à l'API"},
    {step: 3, text: "L'API vérifie le mot de passe et signe un jeton à durée de vie courte"},
    {step: 6, text: 'Chaque appel suivant porte le jeton dans l’en-tête Authorization'},
  ],
};
