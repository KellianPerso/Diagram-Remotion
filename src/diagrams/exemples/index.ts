import {diagram, Entry, sequence} from '../../lib/entries';
import {architectureAws} from './architecture-aws';
import {sequenceConnexion} from './sequence-connexion';

// Chaque dossier de src/diagrams/ exporte par défaut la liste de ses schémas (ordre du Studio).
const entries: Entry[] = [diagram(architectureAws), sequence(sequenceConnexion)];

export default entries;
