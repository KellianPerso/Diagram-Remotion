import {DiagramSpec, NodeSpec} from '../../lib/Diagram';
import {C} from '../../lib/theme';

// Nœud « icône » : pictogramme + titre + sous-titre (tech) en dessous.
const ico = (n: Omit<NodeSpec, 'kind'>): NodeSpec => ({kind: 'icon', size: 60, w: 200, ...n});

// Coordonnées en pixels sur un canevas 1920 x 1080 ; x, y = centre du nœud.
export const architectureAws: DiagramSpec = {
  id: 'Exemple-1-Architecture-AWS',
  brand: 'Mon projet',
  title: 'Application web sur AWS',
  subtitle: 'Front statique sur CloudFront, API conteneurisée sur ECS Fargate, base PostgreSQL managée',
  tag: 'EXEMPLE · SCHÉMA',
  source: 'Exemple fourni avec remotion-diagrams · src/diagrams/exemples/architecture-aws.ts',
  stepFrames: 20, // frames entre deux étapes (30 frames = 1 s)
  groups: [
    {id: 'cloud', x: 170, y: 160, w: 1580, h: 860, label: 'AWS Cloud', style: 'cloud', step: 0},
    {id: 'region', x: 190, y: 210, w: 1540, h: 790, label: 'Région eu-west-3 (Paris)', style: 'region', step: 0},
    {id: 'vpc', x: 430, y: 260, w: 1060, h: 720, label: 'VPC 10.0.0.0/16', style: 'vpc', step: 2},
    {id: 'pub', x: 450, y: 320, w: 280, h: 640, label: 'Public', style: 'public', step: 2},
    {id: 'app', x: 750, y: 320, w: 360, h: 640, label: 'Privé · app', style: 'private', step: 2},
    {id: 'data', x: 1130, y: 320, w: 340, h: 640, label: 'Privé · données', style: 'private', step: 2},
  ],
  nodes: [
    ico({id: 'users', x: 85, y: 600, w: 150, icon: 'aws:Users', title: 'Utilisateurs', tech: 'navigateur', step: 0, external: true}),
    ico({id: 'dns', x: 310, y: 330, icon: 'aws:AmazonRoute53', title: 'Route 53', tech: 'app.exemple.fr', step: 1}),
    ico({id: 'cdn', x: 310, y: 600, icon: 'aws:AmazonCloudFront', title: 'CloudFront', tech: 'HTTPS, cache', step: 1}),
    ico({id: 's3', x: 310, y: 860, icon: 'aws:AmazonSimpleStorageService', title: 'S3', tech: 'front statique', step: 1.5}),
    ico({id: 'alb', x: 590, y: 600, icon: 'aws:ElasticLoadBalancingApplicationLoadBalancer', title: 'Load balancer', tech: 'ALB · /api/*', step: 3}),
    ico({id: 'api1', x: 930, y: 470, icon: 'aws:AWSFargate', title: 'API · tâche 1', tech: 'ECS Fargate', step: 4}),
    ico({id: 'api2', x: 930, y: 740, icon: 'aws:AWSFargate', title: 'API · tâche 2', tech: 'ECS Fargate', step: 4}),
    ico({id: 'db', x: 1300, y: 600, icon: 'aws:AmazonRDS', title: 'PostgreSQL', tech: 'RDS Multi-AZ', step: 5}),
    ico({id: 'secrets', x: 1620, y: 420, icon: 'aws:AWSSecretsManager', title: 'Secrets Manager', tech: 'mot de passe BDD', step: 6}),
    ico({id: 'logs', x: 1620, y: 780, icon: 'aws:AmazonCloudWatch', title: 'CloudWatch', tech: 'logs, alarmes', step: 6}),
  ],
  // from / to : [id du nœud ou du groupe, côté, décalage optionnel en px]
  edges: [
    {from: ['users', 'top'], to: ['dns', 'left'], via: [[85, 330]], label: 'DNS', labelT: 0.3, step: 1},
    {from: ['users', 'right'], to: ['cdn', 'left'], label: 'HTTPS', labelDy: -22, step: 1.5},
    {from: ['cdn', 'bottom'], to: ['s3', 'top'], label: 'fichiers statiques', labelDx: -75, step: 1.5, color: C.storage, packetColor: C.storage},
    {from: ['cdn', 'right'], to: ['alb', 'left'], label: '/api/*', labelDy: -22, step: 3},
    {from: ['alb', 'right', -10], to: ['api1', 'left'], step: 4},
    {from: ['alb', 'right', 10], to: ['api2', 'left'], step: 4},
    {from: ['api1', 'right'], to: ['db', 'left', -10], step: 5, color: C.database, packetColor: C.database},
    {from: ['api2', 'right'], to: ['db', 'left', 10], label: 'SQL (TLS)', labelT: 0.7, labelDy: 26, step: 5, color: C.database, packetColor: C.database},
    {from: ['api1', 'top'], to: ['secrets', 'left'], via: [[930, 300], [1540, 300], [1540, 420]], label: 'lit au démarrage', labelT: 0.45, dashed: true, step: 6, packets: 1},
    {from: ['api2', 'bottom'], to: ['logs', 'left'], via: [[930, 940], [1540, 940], [1540, 780]], label: 'logs', labelT: 0.45, dashed: true, step: 6, color: C.mgmt, packetColor: C.mgmt},
  ],
  legend: {
    x: 1520,
    y: 1035,
    step: 6,
    items: [
      {color: C.line, text: 'Requête'},
      {color: C.line, text: 'Accès secondaire', dashed: true},
    ],
  },
  // sous-titres en haut à droite (vidéo uniquement), chacun affiché à partir de son étape
  captions: [
    {step: 0, text: "L'utilisateur résout le nom de domaine, puis passe par CloudFront"},
    {step: 1.5, text: 'Le front (fichiers statiques) est servi depuis S3, mis en cache par CloudFront'},
    {step: 3, text: "Les appels /api/* sont transmis au load balancer, seul point d'entrée du VPC"},
    {step: 4, text: "L'API tourne en deux tâches Fargate dans un sous-réseau privé"},
    {step: 5, text: 'Les données sont dans PostgreSQL (RDS), inaccessible depuis Internet'},
    {step: 6, text: 'Secrets dans Secrets Manager, logs et alarmes dans CloudWatch'},
  ],
};
