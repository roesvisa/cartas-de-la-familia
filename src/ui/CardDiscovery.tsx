import type { Card } from '../domain/models';
import { PhysicalCard } from './PhysicalCard';
export function CardDiscovery({card}: {card:Card}) { return <PhysicalCard key={card.id} card={card}/>; }
