
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapComponent } from './components/map/map.component';
import { UIOverlayComponent } from './components/ui-overlay/ui-overlay.component';
import { DataService, Village, Business } from './services/data.service';
import { DiscoveryService } from './services/discovery.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, MapComponent, UIOverlayComponent],
  template: `
    <div class="relative w-full h-screen bg-[#05080a] overflow-hidden text-white selection:bg-cyan-500/30">
      <app-map 
        (villageSelect)="onVillageSelect($event)" 
        (businessSelect)="onBusinessSelect($event)"
        [selectedVillageId]="activeVillage()?.id"
      ></app-map>

      <app-ui-overlay 
        [selectedVillage]="activeVillage()" 
        [selectedBusiness]="activeBusiness()"
        (villageSelect)="onVillageSelect($event)"
        (closeModal)="closeVillage()"
      ></app-ui-overlay>
      
      <div class="fixed bottom-0 left-0 w-full bg-black/40 backdrop-blur-md border-t border-white/5 py-2 z-50 overflow-hidden pointer-events-none">
        <div class="flex whitespace-nowrap animate-marquee items-center space-x-8 px-4">
          @for (item of newsItems; track $index) {
            <span class="text-[10px] uppercase tracking-[0.2em] font-tech text-cyan-500">
              <span class="mr-2 text-white/20">•</span> {{ item }}
            </span>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
    .animate-marquee { display: inline-flex; animation: marquee 60s linear infinite; }
  `]
})
export class AppComponent {
  private dataService = inject(DataService);
  private discoveryService = inject(DiscoveryService);
  
  activeVillage = signal<Village | null>(null);
  activeBusiness = signal<Business | null>(null);

  newsItems = [
    "Gemini Discovery: 12 new businesses mapped in Phokeng Region",
    "Royal Bafokeng Stadium to host international athletics meet",
    "Digital Twin Project: All 29 villages now live in 3D Portal",
    "Heritage Alert: New historical artifacts discovered near Sun City",
    "Local Economy: Small businesses in Tantanana report 15% growth"
  ];

  async onVillageSelect(village: Village) {
    this.activeVillage.set(village);
    this.activeBusiness.set(null);
    this.dataService.discoveredBusinesses.set([]);
    
    // Trigger Gemini discovery
    this.dataService.isDiscovering.set(true);
    const results = await this.discoveryService.discoverVillageEconomy(village.name);
    this.dataService.discoveredBusinesses.set(results);
    this.dataService.isDiscovering.set(false);
  }

  onBusinessSelect(business: Business) {
    this.activeBusiness.set(business);
  }

  closeVillage() {
    this.activeVillage.set(null);
    this.activeBusiness.set(null);
    this.dataService.discoveredBusinesses.set([]);
  }
}
