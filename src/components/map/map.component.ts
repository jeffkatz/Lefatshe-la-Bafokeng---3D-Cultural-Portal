
import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, inject, input, output, effect, ViewChildren, QueryList } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { DataService, Village, Business } from '../../services/data.service';

@Component({
  selector: 'app-map',
  standalone: true,
  template: `
    <div #canvasContainer class="w-full h-full bg-[#05080a] relative overflow-hidden">
      <canvas #mapCanvas></canvas>
      
      @for (v of villages(); track v.id) {
        <div 
          #villageLabel
          [id]="'label-' + v.id"
          class="absolute pointer-events-none transition-opacity duration-300 opacity-0 will-change-transform"
        >
          <div class="px-2 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/40 backdrop-blur-md rounded text-[9px] text-[#D4AF37] font-tech uppercase tracking-widest whitespace-nowrap">
            {{ v.name }}
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
  `]
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasContainer') containerRef!: ElementRef<HTMLDivElement>;
  @ViewChildren('villageLabel') labelElements!: QueryList<ElementRef<HTMLDivElement>>;

  selectedVillageId = input<string | undefined>();
  villageSelect = output<Village>();
  businessSelect = output<Business>();

  private dataService = inject(DataService);
  villages = this.dataService.getVillages();

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private composer!: EffectComposer;
  private bloomPass!: UnrealBloomPass;
  
  private animationId!: number;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  
  private villageMarkers: THREE.Group[] = [];
  private businessMesh!: THREE.InstancedMesh;
  private terrainGroup!: THREE.Group;
  
  private labelDomMap = new Map<string, HTMLElement>();
  private MAX_BUSINESS_INSTANCES = 500;
  private hoveredVillageId: string | null = null;

  constructor() {
    effect(() => {
      const id = this.selectedVillageId();
      if (id) {
        this.focusOnVillage(id);
      }
      this.updateAllMarkersIntensity();
    });

    effect(() => {
      const businesses = this.dataService.discoveredBusinesses();
      this.updateBusinessInstances(businesses);
    });
  }

  ngAfterViewInit() {
    this.initThree();
    this.initPostProcessing();
    this.createHolographicTerrain();
    this.createMarkers();
    this.createBusinessInstancedMesh();
    
    setTimeout(() => {
      this.labelElements.forEach(el => {
        const id = el.nativeElement.id.replace('label-', '');
        this.labelDomMap.set(id, el.nativeElement);
      });
      this.animate();
    }, 200);

    window.addEventListener('resize', this.onResize.bind(this));
    this.canvasRef.nativeElement.addEventListener('click', this.onMouseClick.bind(this));
    this.canvasRef.nativeElement.addEventListener('mousemove', this.onMouseMove.bind(this));
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseMove);
    this.renderer.dispose();
  }

  private initThree() {
    const canvas = this.canvasRef.nativeElement;
    const width = this.containerRef.nativeElement.clientWidth;
    const height = this.containerRef.nativeElement.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05080a);
    this.scene.fog = new THREE.Fog(0x05080a, 40, 180);

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.camera.position.set(60, 50, 70);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Shadows Setup
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.maxPolarAngle = Math.PI / 2.15;
    this.controls.minDistance = 20;
    this.controls.maxDistance = 220;

    // Lighting for Royal Atmosphere
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.2));

    // Directional light for soft shadows
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 50, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -70;
    dirLight.shadow.camera.right = 70;
    dirLight.shadow.camera.top = 70;
    dirLight.shadow.camera.bottom = -70;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.radius = 4;
    this.scene.add(dirLight);

    // Spotlight to focus on the center "Capital" island
    const spotLight = new THREE.SpotLight(0xD4AF37, 1000);
    spotLight.position.set(0, 40, 0);
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.5;
    spotLight.decay = 2;
    spotLight.distance = 150;
    spotLight.castShadow = true;
    this.scene.add(spotLight);

    // Localized glow
    const pointLight = new THREE.PointLight(0xD4AF37, 3, 100);
    pointLight.position.set(-10, 15, 10);
    this.scene.add(pointLight);
  }

  private initPostProcessing() {
    const width = this.containerRef.nativeElement.clientWidth;
    const height = this.containerRef.nativeElement.clientHeight;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      1.2,   // strength
      0.3,   // radius
      0.82   // threshold
    );
    this.composer.addPass(this.bloomPass);
  }

  private createHolographicTerrain() {
    this.terrainGroup = new THREE.Group();
    const geometry = new THREE.PlaneGeometry(130, 130, 200, 200);
    const pos = geometry.attributes.position;
    
    // Deform terrain for topographical interest
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const dist = Math.sqrt(x*x + y*y);
      if (dist < 60) {
        const h = (Math.sin(x * 0.1) * Math.cos(y * 0.1) * 4) + 
                  (Math.sin(x * 0.3) * Math.cos(y * 0.3) * 0.8) +
                  (Math.random() * 0.1);
        pos.setZ(i, h);
      } else {
        // Drop off for "Floating Island" look
        pos.setZ(i, -20);
      }
    }
    geometry.computeVertexNormals();

    // Terrain material: Deep Charcoal with velvet-like properties
    const terrainMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x0a0f12,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: false
    });
    
    const mesh = new THREE.Mesh(geometry, terrainMaterial);
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    this.terrainGroup.add(mesh);

    // Holographic wireframe overlay
    const wireMat = new THREE.MeshBasicMaterial({ 
      color: 0xD4AF37, 
      wireframe: true, 
      transparent: true, 
      opacity: 0.04 
    });
    const wire = new THREE.Mesh(geometry.clone(), wireMat);
    wire.rotation.x = -Math.PI / 2;
    wire.position.y = 0.05;
    this.terrainGroup.add(wire);

    this.scene.add(this.terrainGroup);
  }

  private createMarkers() {
    this.villages().forEach(v => {
      const g = new THREE.Group();
      g.position.set(v.coordinates.x, v.coordinates.y, v.coordinates.z);
      g.userData = { villageId: v.id };
      
      const markerMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xD4AF37, 
        emissive: 0xD4AF37, 
        emissiveIntensity: 0.4,
        roughness: 0.1,
        metalness: 0.9
      });

      const pin = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.8, 8), markerMaterial);
      pin.rotation.x = Math.PI;
      pin.position.y = 0.9;
      pin.castShadow = true;
      pin.receiveShadow = true;
      g.add(pin);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), markerMaterial);
      head.position.y = 1.8;
      head.castShadow = true;
      head.receiveShadow = true;
      g.add(head);

      const ringMaterial = new THREE.MeshStandardMaterial({
        color: 0xD4AF37,
        emissive: 0xD4AF37,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.3,
        metalness: 1.0
      });
      
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.03, 16, 32), ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.castShadow = true;
      g.add(ring);

      this.scene.add(g);
      this.villageMarkers.push(g);
    });
  }

  private updateAllMarkersIntensity() {
    this.villageMarkers.forEach(g => {
      const id = g.userData['villageId'];
      const isSelected = id === this.selectedVillageId();
      const isHovered = id === this.hoveredVillageId;
      
      g.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          let intensity = 0.4;
          if (isSelected) intensity = 6.0;
          else if (isHovered) intensity = 2.0;
          
          child.material.emissiveIntensity = intensity;
        }
      });
    });
  }

  private createBusinessInstancedMesh() {
    const geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x00ffff, 
      emissive: 0x00ffff, 
      emissiveIntensity: 1.5 
    });
    this.businessMesh = new THREE.InstancedMesh(geometry, material, this.MAX_BUSINESS_INSTANCES);
    this.businessMesh.count = 0;
    this.businessMesh.castShadow = true;
    this.scene.add(this.businessMesh);
  }

  private updateBusinessInstances(businesses: Business[]) {
    if (!this.businessMesh) return;
    const count = Math.min(businesses.length, this.MAX_BUSINESS_INSTANCES);
    this.businessMesh.count = count;
    const dummy = new THREE.Object3D();
    const activeVillage = this.villages().find(v => v.id === this.selectedVillageId());
    
    if (!activeVillage) {
      this.businessMesh.count = 0;
      return;
    }

    businesses.forEach((biz, i) => {
      const angle = (i / count) * Math.PI * 2;
      const radius = 3.5 + Math.random() * 5;
      dummy.position.set(
        activeVillage.coordinates.x + Math.cos(angle) * radius,
        activeVillage.coordinates.y + 1.2,
        activeVillage.coordinates.z + Math.sin(angle) * radius
      );
      dummy.rotation.set(Math.random(), Math.random(), Math.random());
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      this.businessMesh.setMatrixAt(i, dummy.matrix);
    });
    this.businessMesh.instanceMatrix.needsUpdate = true;
  }

  private animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));
    const width = this.containerRef.nativeElement.clientWidth;
    const height = this.containerRef.nativeElement.clientHeight;
    const time = Date.now() * 0.001;

    // Subtle "Floating Island" bobbing
    if (this.terrainGroup) {
      this.terrainGroup.position.y = Math.sin(time * 0.5) * 0.4;
    }

    this.villageMarkers.forEach(g => {
      const ring = g.children[2] as THREE.Mesh;
      ring.rotation.z += 0.01;
      ring.scale.setScalar(1 + Math.sin(time * 2) * 0.1);
      
      // Inherit island bobbing offset for markers
      g.position.y = (this.villages().find(v => v.id === g.userData['villageId'])?.coordinates.y || 0) + (Math.sin(time * 0.5) * 0.4);

      const vid = g.userData['villageId'];
      const lbl = this.labelDomMap.get(vid);
      if (lbl) {
        const v = new THREE.Vector3();
        g.getWorldPosition(v);
        v.project(this.camera);
        const x = (v.x * 0.5 + 0.5) * width;
        const y = (v.y * -0.5 + 0.5) * height;
        lbl.style.transform = `translate3d(-50%, -100%, 0) translate3d(${x}px, ${y}px, 0)`;
        lbl.style.opacity = (v.z < 1 && v.z > -1) ? '1' : '0';
      }
    });

    this.controls.update();
    this.composer.render();
  }

  private onResize() {
    const w = this.containerRef.nativeElement.clientWidth;
    const h = this.containerRef.nativeElement.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
  }

  private onMouseMove(event: MouseEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const intersectsVillage = this.raycaster.intersectObjects(this.villageMarkers, true);
    let newHoverId: string | null = null;
    
    if (intersectsVillage.length > 0) {
      let obj = intersectsVillage[0].object;
      while (obj.parent && !obj.userData['villageId']) obj = obj.parent;
      newHoverId = obj.userData['villageId'];
    }

    if (this.hoveredVillageId !== newHoverId) {
      this.hoveredVillageId = newHoverId;
      this.updateAllMarkersIntensity();
    }
  }

  private onMouseClick(event: MouseEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const intersectsVillage = this.raycaster.intersectObjects(this.villageMarkers, true);
    if (intersectsVillage.length > 0) {
      let obj = intersectsVillage[0].object;
      while (obj.parent && !obj.userData['villageId']) obj = obj.parent;
      const v = this.villages().find(v => v.id === obj.userData['villageId']);
      if (v) this.villageSelect.emit(v);
      return;
    }

    const intersectInstance = this.raycaster.intersectObject(this.businessMesh);
    if (intersectInstance.length > 0 && intersectInstance[0].instanceId !== undefined) {
      const idx = intersectInstance[0].instanceId;
      const biz = this.dataService.discoveredBusinesses()[idx];
      if (biz) this.businessSelect.emit(biz);
    }
  }

  private focusOnVillage(id: string) {
    const v = this.villages().find(v => v.id === id);
    if (v) {
      const t = new THREE.Vector3(v.coordinates.x, v.coordinates.y, v.coordinates.z);
      this.controls.target.lerp(t, 0.1);
      this.camera.position.lerp(t.clone().add(new THREE.Vector3(30, 25, 30)), 0.05);
    }
  }
}
