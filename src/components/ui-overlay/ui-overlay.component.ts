
import { Component, input, output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, Village, Business } from '../../services/data.service';

@Component({
  selector: 'app-ui-overlay',
  imports: [CommonModule],
  template: `
    <!-- Top Left: Brand -->
    <div class="fixed top-8 left-8 z-50 pointer-events-none">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 border-2 border-[#D4AF37] rounded-lg flex items-center justify-center animate-pulse">
          <div class="w-6 h-6 bg-[#D4AF37]/50 rounded-full"></div>
        </div>
        <div>
          <h1 class="text-2xl font-headline font-black text-white tracking-tighter uppercase">LEFATSHE <span class="text-[#D4AF37]">LA BAFOKENG</span></h1>
          <p class="text-[9px] font-tech text-white/40 uppercase tracking-[0.4em]">Royal Heritage Intelligence</p>
        </div>
      </div>
    </div>

    <!-- Left Sidebar: Business Intelligence -->
    <div class="fixed left-8 top-32 w-64 space-y-4 z-40 pointer-events-none">
      <div class="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 pointer-events-auto">
        <h3 class="text-[10px] font-tech text-[#D4AF37] uppercase tracking-widest mb-4">Discovery Engine</h3>
        @if (isDiscovering()) {
          <div class="space-y-4">
            <div class="flex justify-between items-center text-[9px] text-white/60">
              <span class="animate-pulse">Gleaning local data...</span>
              <span class="text-[#D4AF37]">AI ACTIVE</span>
            </div>
            <div class="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div class="h-full bg-[#D4AF37] animate-[loading_2s_infinite]"></div>
            </div>
          </div>
        } @else if (businesses().length > 0) {
          <div class="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
            @for (biz of businesses(); track biz.name) {
              <div class="p-2 bg-white/5 border border-white/5 rounded-lg hover:border-[#D4AF37]/30 transition-colors">
                <div class="text-[9px] text-[#D4AF37] font-tech mb-1 uppercase tracking-tighter">{{ biz.category }}</div>
                <div class="text-[10px] font-bold text-white leading-tight">{{ biz.name }}</div>
              </div>
            }
          </div>
        } @else {
          <p class="text-[10px] text-white/40 italic">Select a village to discover local institutions and commerce.</p>
        }
      </div>
    </div>

    <!-- Right Sidebar: Cultural Layer -->
    <div class="fixed right-8 top-8 w-72 h-[calc(100vh-6rem)] z-40 pointer-events-none">
      <div class="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 h-full flex flex-col pointer-events-auto shadow-2xl">
        <div class="flex items-center gap-2 mb-6">
          <div class="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></div>
          <h2 class="text-[10px] font-tech text-white uppercase tracking-widest">Village Registry (29+)</h2>
        </div>
        
        <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
          @for (region of villageGroups(); track region.name) {
            <div>
              <h3 class="text-[9px] font-tech text-[#D4AF37]/60 uppercase mb-3 tracking-widest border-b border-white/5 pb-1">{{ region.name }}</h3>
              <div class="space-y-1">
                @for (v of region.villages; track v.id) {
                  <button (click)="onSelect(v)" 
                    [class.border-[#D4AF37]]="selectedVillage()?.id === v.id"
                    [class.bg-[#D4AF37]/10]="selectedVillage()?.id === v.id"
                    class="w-full text-left px-3 py-2 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 hover:border-[#D4AF37]/30 transition-all">
                    <div class="text-[11px] font-medium text-white">{{ v.name }}</div>
                  </button>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>

    <!-- Center Selection Modal -->
    @if (selectedVillage(); as village) {
      <div class="fixed bottom-16 left-1/2 transform -translate-x-1/2 z-50 pointer-events-auto animate-in slide-in-from-bottom-10 duration-500">
        <div class="w-[500px] bg-[#0c1a24]/95 backdrop-blur-3xl border border-[#D4AF37]/30 rounded-3xl p-8 shadow-[0_0_80px_rgba(212,175,55,0.05)]">
          <div class="flex justify-between items-start mb-6">
            <div>
              <h2 class="text-4xl font-headline font-black text-white tracking-tight uppercase">{{ village.name }}</h2>
              <div class="flex gap-4 mt-2">
                <p class="text-[9px] font-tech text-[#D4AF37] uppercase tracking-widest">Region: {{ village.region }}</p>
                <p class="text-[9px] font-tech text-white/40 uppercase tracking-widest">Heritage Level: Primordial</p>
              </div>
            </div>
            <button (click)="onClose()" class="p-2 hover:bg-white/10 rounded-full text-white/40 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="grid grid-cols-2 gap-8 mb-8">
            <section>
              <h3 class="text-[9px] font-tech text-white/40 uppercase mb-3 tracking-[0.2em]">Leadership</h3>
              <div class="space-y-2">
                @for (leader of village.leadership; track leader) {
                  <div class="text-[11px] text-white/80 flex items-center gap-2">
                    <span class="w-1 h-1 bg-[#D4AF37] rounded-full"></span>
                    {{ leader }}
                  </div>
                }
              </div>
            </section>
            <section>
              <h3 class="text-[9px] font-tech text-white/40 uppercase mb-3 tracking-[0.2em]">Cultural Snippet</h3>
              <p class="text-[11px] text-white/60 leading-relaxed italic">
                {{ village.history }}
              </p>
            </section>
          </div>

          @if (selectedBusiness(); as biz) {
            <div class="mb-8 p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl animate-in fade-in zoom-in-95">
              <div class="flex justify-between items-start">
                <div>
                  <div class="text-[10px] font-tech text-[#D4AF37] mb-1 uppercase">Institution Detected: {{ biz.category }}</div>
                  <div class="text-sm font-bold text-white mb-1">{{ biz.name }}</div>
                  <div class="text-[11px] text-white/60 mb-2">{{ biz.detail }}</div>
                </div>
                @if (biz.sourceUrl) {
                  <a [href]="biz.sourceUrl" target="_blank" class="text-[9px] font-tech text-cyan-400 hover:text-cyan-300 uppercase tracking-widest border border-cyan-400/30 px-2 py-1 rounded transition-colors">
                    Source
                  </a>
                }
              </div>
            </div>
          }

          <div class="flex gap-4">
            <button class="flex-1 py-4 bg-[#D4AF37] text-black font-tech font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#c49f27] transition-all hover:scale-[1.02] active:scale-[0.98]">
              Traditional Records
            </button>
            <button class="flex-1 py-4 bg-white/5 border border-white/10 text-white font-tech font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all">
              Economic Statistics
            </button>
          </div>
        </div>
      </div>
    }

    <style>
      @keyframes loading {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      .custom-scrollbar::-webkit-scrollbar { width: 4px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.2); border-radius: 10px; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212,175,55,0.4); }
    </style>
  `
})
export class UIOverlayComponent {
  private dataService = inject(DataService);
  
  villages = this.dataService.getVillages();
  businesses = this.dataService.discoveredBusinesses;
  isDiscovering = this.dataService.isDiscovering;

  selectedVillage = input<Village | null>(null);
  selectedBusiness = input<Business | null>(null);
  
  closeModal = output<void>();
  villageSelect = output<Village>();

  villageGroups = computed(() => {
    const list = this.villages();
    const groups: { name: string, villages: Village[] }[] = [];
    const regions = ['CAPITAL', 'NORTH', 'NORTH EAST', 'SOUTH EAST'];
    
    regions.forEach(r => {
      groups.push({
        name: r,
        villages: list.filter(v => v.region === r)
      });
    });
    return groups;
  });

  onSelect(village: Village) {
    this.villageSelect.emit(village);
  }

  onClose() {
    this.closeModal.emit();
  }
}
