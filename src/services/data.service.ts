
import { Injectable, signal } from '@angular/core';

export interface Coordinate {
  x: number;
  y: number;
  z: number;
}

export interface Business {
  name: string;
  category: string;
  detail: string;
  sourceUrl?: string;
  instanceIndex?: number;
}

export interface Village {
  id: string;
  name: string;
  region: string;
  coordinates: Coordinate;
  history: string;
  leadership: string[];
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  discoveredBusinesses = signal<Business[]>([]);
  isDiscovering = signal<boolean>(false);

  private villages = signal<Village[]>([
    // CAPITAL REGION
    { id: 'phokeng', name: 'Phokeng', region: 'CAPITAL', coordinates: { x: -5, y: 1, z: 15 }, history: 'The administrative and cultural capital of the Royal Bafokeng Nation.', leadership: ['Kgosi Leruo Molotlegi'] },
    { id: 'bobuomjwa', name: 'Bobuomjwa', region: 'CAPITAL', coordinates: { x: -2, y: 1, z: 18 }, history: 'A key residential area near the capital.', leadership: ['Traditional Council'] },
    { id: 'lefaragatlhe', name: 'Lefaragatlhe', region: 'CAPITAL', coordinates: { x: -8, y: 1, z: 20 }, history: 'Historically significant village in the southern capital zone.', leadership: ['Headman Lefaragatlhe'] },

    // NORTH REGION
    { id: 'chaneng', name: 'Chaneng', region: 'NORTH', coordinates: { x: -22, y: 0.5, z: -15 }, history: 'A major village in the northern mining belt.', leadership: ['Traditional Council'] },
    { id: 'robega', name: 'Robega', region: 'NORTH', coordinates: { x: -20, y: 0.5, z: -12 }, history: 'Vibrant community with strong ties to platinum mining.', leadership: ['Headman Robega'] },
    { id: 'mafenya', name: 'Mafenya', region: 'NORTH', coordinates: { x: -28, y: 0.5, z: -10 }, history: 'Border village near the Pilanesberg National Park.', leadership: ['Headman Mafenya'] },
    { id: 'rasimone', name: 'Rasimone', region: 'NORTH', coordinates: { x: -24, y: 0.5, z: -5 }, history: 'Home to some of the world\'s largest platinum reserves.', leadership: ['Rasimone Traditional Council'] },
    { id: 'mogono', name: 'Mogono', region: 'NORTH', coordinates: { x: -10, y: 0.5, z: -2 }, history: 'Central-northern hub for community services.', leadership: ['Headman Mogono'] },
    { id: 'luka', name: 'Luka', region: 'NORTH', coordinates: { x: -8, y: 0.5, z: 5 }, history: 'One of the largest and most industrial villages.', leadership: ['Headman Luka'] },
    { id: 'roodekraalspruit', name: 'Roodekraalspruit', region: 'NORTH', coordinates: { x: -12, y: 0.5, z: -18 }, history: 'Agricultural and mining transition zone.', leadership: ['Traditional Council'] },

    // NORTH EAST REGION
    { id: 'tantanana', name: 'Tantanana', region: 'NORTH EAST', coordinates: { x: 15, y: 0.5, z: -25 }, history: 'Key village in the North East region.', leadership: ['Headman Tantanana'] },
    { id: 'maile_kopman', name: 'Maile-Kopman', region: 'NORTH EAST', coordinates: { x: 10, y: 0.5, z: -20 }, history: 'Gateway to the eastern Bafokeng lands.', leadership: ['Traditional Council'] },
    { id: 'motsitle', name: 'Motsitle', region: 'NORTH EAST', coordinates: { x: 18, y: 0.5, z: -18 }, history: 'Residential hub for eastern region workers.', leadership: ['Traditional Council'] },
    { id: 'diepkuil', name: 'Diepkuil', region: 'NORTH EAST', coordinates: { x: 12, y: 0.5, z: -12 }, history: 'Known for its unique topographical features.', leadership: ['Traditional Council'] },
    { id: 'maile_ext', name: 'Maile Ext', region: 'NORTH EAST', coordinates: { x: 20, y: 0.5, z: -10 }, history: 'Expanding residential development.', leadership: ['Traditional Council'] },
    { id: 'tsitsing', name: 'Tsitsing', region: 'NORTH EAST', coordinates: { x: 14, y: 0.5, z: -5 }, history: 'Growing economic center in the NE.', leadership: ['Headman Tsitsing'] },
    { id: 'tlaseng', name: 'Tlaseng', region: 'NORTH EAST', coordinates: { x: 22, y: 0.5, z: -5 }, history: 'Strategic location for regional logistics.', leadership: ['Headman Tlaseng'] },

    // CENTRAL/EAST
    { id: 'mogojane', name: 'Mogojane', region: 'NORTH EAST', coordinates: { x: 28, y: 0.5, z: 2 }, history: 'Border community with vibrant local trade.', leadership: ['Traditional Council'] },
    { id: 'lesung', name: 'Lesung', region: 'NORTH EAST', coordinates: { x: 24, y: 0.5, z: 6 }, history: 'Quiet residential area with rich cultural roots.', leadership: ['Traditional Council'] },
    { id: 'serutube', name: 'Serutube', region: 'NORTH EAST', coordinates: { x: 15, y: 0.5, z: 10 }, history: 'Central hub connecting the East and West.', leadership: ['Traditional Council'] },
    { id: 'mafika', name: 'Mafika', region: 'NORTH EAST', coordinates: { x: 20, y: 0.5, z: 12 }, history: 'Named after the stones that define its terrain.', leadership: ['Traditional Council'] },
    { id: 'kanana', name: 'Kanana', region: 'NORTH EAST', coordinates: { x: 12, y: 0.5, z: 18 }, history: 'Vibrant youth and community programs.', leadership: ['Headman Kanana'] },

    // SOUTH EAST REGION
    { id: 'marakana', name: 'Marakana', region: 'SOUTH EAST', coordinates: { x: 32, y: 0.5, z: 15 }, history: 'Vital community on the eastern edge.', leadership: ['Traditional Council'] },
    { id: 'mabitse', name: 'Mabitse', region: 'SOUTH EAST', coordinates: { x: 35, y: 0.5, z: 18 }, history: 'Rich in traditional heritage.', leadership: ['Traditional Council'] },
    { id: 'tlapa_east', name: 'Tlapa East', region: 'SOUTH EAST', coordinates: { x: 40, y: 0.5, z: 22 }, history: 'Transition zone to neighboring municipalities.', leadership: ['Traditional Council'] },
    { id: 'tlapa', name: 'Tlapa', region: 'SOUTH EAST', coordinates: { x: 38, y: 0.5, z: 25 }, history: 'Stone-rich terrain with historical significance.', leadership: ['Traditional Council'] },
    { id: 'leloreng', name: 'Leloreng', region: 'SOUTH EAST', coordinates: { x: 35, y: 0.5, z: 28 }, history: 'Known for its community spirit.', leadership: ['Traditional Council'] },
    { id: 'thekwane', name: 'Thekwane', region: 'SOUTH EAST', coordinates: { x: 30, y: 0.5, z: 32 }, history: 'Southern boundary marker of Bafokeng land.', leadership: ['Headman Thekwane'] },
    { id: 'mfidikwe', name: 'Mfidikwe', region: 'SOUTH EAST', coordinates: { x: 22, y: 0.5, z: 30 }, history: 'Expanding residential and service area.', leadership: ['Headman Mfidikwe'] },
    { id: 'photsaneng', name: 'Photsaneng', region: 'SOUTH EAST', coordinates: { x: 28, y: 0.5, z: 38 }, history: 'Vibrant local economy and trade.', leadership: ['Headman Photsaneng'] },
    { id: 'nkaneng', name: 'Nkaneng', region: 'SOUTH EAST', coordinates: { x: 35, y: 0.5, z: 35 }, history: 'Significant informal community integration area.', leadership: ['Traditional Council'] }
  ]);

  getVillages() {
    return this.villages;
  }
}
