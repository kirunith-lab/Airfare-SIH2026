import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Plane, Radio, RefreshCw, Compass, Eye, ShieldCheck, Activity, MapPin } from "lucide-react";

interface AirportHub {
  code: string;
  name: string;
  city: string;
  lat: number;
  lon: number;
  fare: number;
  baseFare: number;
  weightPct: number;
  status: "high_traffic" | "active";
}

interface CorridorRoute {
  id: string;
  from: string;
  to: string;
  weight: number;
  currentFare: number;
  basePrice: number;
  momChange: number;
  color: string;
}

interface ActiveFlight {
  id: string;
  airline: string;
  airlineName: string;
  flightNo: string;
  from: string;
  to: string;
  fare: number;
  fairFareScore: number;
  altitude: string;
  speed: string;
  progress: number;
  speedRate: number;
  curve: THREE.QuadraticBezierCurve3;
  mesh: THREE.Group;
  tailTrail: THREE.Line;
  spriteLabel: THREE.Sprite;
}

const SCALE = 3.8;
const CENTER_LON = 82.0;
const CENTER_LAT = 22.0;
const ELEVATION = 3.5;

const INDIAN_HUBS: Record<string, AirportHub> = {
  DEL: { code: "DEL", name: "Indira Gandhi Int'l", city: "Delhi (NCR)", lat: 28.5562, lon: 77.1, fare: 5420, baseFare: 4850, weightPct: 16.0, status: "high_traffic" },
  BOM: { code: "BOM", name: "Chhatrapati Shivaji Maharaj", city: "Mumbai", lat: 19.0896, lon: 72.8656, fare: 4890, baseFare: 4890, weightPct: 16.0, status: "high_traffic" },
  BLR: { code: "BLR", name: "Kempegowda Int'l", city: "Bengaluru", lat: 13.1986, lon: 77.7066, fare: 5380, baseFare: 5420, weightPct: 13.0, status: "high_traffic" },
  HYD: { code: "HYD", name: "Rajiv Gandhi Int'l", city: "Hyderabad", lat: 17.2403, lon: 78.4294, fare: 4620, baseFare: 4650, weightPct: 8.0, status: "active" },
  MAA: { code: "MAA", name: "Chennai Int'l", city: "Chennai", lat: 12.9941, lon: 80.1709, fare: 4220, baseFare: 4250, weightPct: 8.0, status: "active" },
  CCU: { code: "CCU", name: "Netaji Subhash Chandra", city: "Kolkata", lat: 22.6547, lon: 88.4467, fare: 5100, baseFare: 4950, weightPct: 5.0, status: "active" },
  AMD: { code: "AMD", name: "Sardar Vallabhbhai Patel", city: "Ahmedabad", lat: 23.0772, lon: 72.6347, fare: 4410, baseFare: 4200, weightPct: 4.0, status: "active" },
  GOI: { code: "GOI", name: "Dabolim / Manohar Int'l", city: "Goa", lat: 15.3808, lon: 73.8314, fare: 4750, baseFare: 4500, weightPct: 4.0, status: "active" },
  PNQ: { code: "PNQ", name: "Pune Airport", city: "Pune", lat: 18.5822, lon: 73.9197, fare: 4320, baseFare: 4150, weightPct: 3.0, status: "active" },
  COK: { code: "COK", name: "Cochin Int'l", city: "Kochi", lat: 10.152, lon: 76.3922, fare: 4950, baseFare: 4700, weightPct: 3.0, status: "active" },
};

const CORRIDORS: CorridorRoute[] = [
  { id: "DEL-BOM", from: "DEL", to: "BOM", weight: 0.16, currentFare: 5240, basePrice: 4850, momChange: 2.4, color: "#38bdf8" },
  { id: "BOM-DEL", from: "BOM", to: "DEL", weight: 0.16, currentFare: 5290, basePrice: 4890, momChange: 2.1, color: "#38bdf8" },
  { id: "DEL-BLR", from: "DEL", to: "BLR", weight: 0.13, currentFare: 5890, basePrice: 5420, momChange: 4.8, color: "#818cf8" },
  { id: "BLR-DEL", from: "BLR", to: "DEL", weight: 0.13, currentFare: 5840, basePrice: 5380, momChange: 4.2, color: "#818cf8" },
  { id: "BOM-BLR", from: "BOM", to: "BLR", weight: 0.11, currentFare: 4280, basePrice: 3950, momChange: 1.8, color: "#34d399" },
  { id: "BLR-BOM", from: "BLR", to: "BOM", weight: 0.11, currentFare: 4290, basePrice: 3980, momChange: 1.6, color: "#34d399" },
  { id: "DEL-HYD", from: "DEL", to: "HYD", weight: 0.08, currentFare: 4980, basePrice: 4650, momChange: 3.5, color: "#fbbf24" },
  { id: "HYD-DEL", from: "HYD", to: "DEL", weight: 0.08, currentFare: 4960, basePrice: 4620, momChange: 3.1, color: "#fbbf24" },
  { id: "BOM-MAA", from: "BOM", to: "MAA", weight: 0.08, currentFare: 4420, basePrice: 4250, momChange: 0.9, color: "#f472b6" },
  { id: "MAA-BOM", from: "MAA", to: "BOM", weight: 0.07, currentFare: 4390, basePrice: 4220, momChange: 0.7, color: "#f472b6" },
  { id: "DEL-CCU", from: "DEL", to: "CCU", weight: 0.05, currentFare: 5210, basePrice: 4950, momChange: 2.0, color: "#a78bfa" },
  { id: "DEL-GOI", from: "DEL", to: "GOI", weight: 0.04, currentFare: 5450, basePrice: 5120, momChange: 1.5, color: "#38bdf8" },
];

const AIRLINES = [
  { code: "6E", name: "IndiGo", color: 0x0284c7 },
  { code: "AI", name: "Air India", color: 0xdc2626 },
  { code: "QP", name: "Akasa Air", color: 0xea580c },
  { code: "SG", name: "SpiceJet", color: 0xb91c1c },
];

// Helper: Convert Lat/Lon to 3D Cartesian coordinates on India planar terrain
function geoToVector3(lat: number, lon: number, yOffset = ELEVATION): THREE.Vector3 {
  const x = (lon - CENTER_LON) * SCALE;
  const z = -(lat - CENTER_LAT) * SCALE;
  return new THREE.Vector3(x, yOffset, z);
}

// Detailed India Border Polygon Coordinates (Lon, Lat)
const INDIA_BORDER_COORDS: [number, number][] = [
  [74.5, 36.8],  // North Kashmir Peak
  [76.8, 35.8],  // Siachen / Ladakh
  [78.8, 34.2],  // Aksai Chin border
  [79.2, 31.8],  // Uttarakhand border
  [80.5, 30.5],  // Kali River / Nepal border
  [88.0, 27.8],  // Sikkim border
  [89.2, 27.2],  // Bhutan border
  [92.0, 27.8],  // Tawang / Arunachal West
  [97.0, 28.2],  // Arunachal East Kibithu
  [96.0, 26.5],  // Nagaland
  [93.5, 23.8],  // Mizoram / Tripura
  [91.8, 25.2],  // Meghalaya
  [89.0, 25.5],  // North Bengal Cooch Behar
  [88.8, 22.0],  // Sundarbans Bay of Bengal
  [86.8, 20.8],  // Odisha Dhamra coast
  [83.2, 18.0],  // Visakhapatnam Andhra coast
  [80.2, 13.1],  // Chennai Marina coast
  [79.8, 10.3],  // Point Calimere
  [77.5, 8.08],  // KANYAKUMARI SOUTHERN TIP
  [76.2, 10.0],  // Kochi Kerala coast
  [74.8, 13.0],  // Mangalore Karnataka
  [73.8, 15.4],  // Goa Candolim coast
  [72.8, 19.1],  // Mumbai Konkan coast
  [72.5, 21.0],  // Surat Gulf of Khambhat
  [69.0, 22.4],  // Dwarka Saurashtra
  [68.1, 23.7],  // Kutch West Guhar Moti
  [71.0, 24.5],  // Rann of Kutch
  [70.2, 26.5],  // Jaisalmer Thar Desert
  [73.8, 29.8],  // Bikaner / Ganganagar
  [74.8, 32.5],  // Jammu
  [74.5, 36.8],  // Close border
];

// Helper: Build a stylized modern commercial airliner mesh
function createAirplaneModel(colorHex: number): THREE.Group {
  const plane = new THREE.Group();

  // Fuselage (Cylinder)
  const bodyGeo = new THREE.CylinderGeometry(0.48, 0.42, 3.8, 14);
  bodyGeo.rotateX(Math.PI / 2);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.6,
    roughness: 0.25,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  plane.add(body);

  // Nose
  const noseGeo = new THREE.ConeGeometry(0.48, 1.1, 14);
  noseGeo.rotateX(Math.PI / 2);
  const noseMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.5 });
  const nose = new THREE.Mesh(noseGeo, noseMat);
  nose.position.z = 2.45;
  plane.add(nose);

  // Cockpit
  const cockpitGeo = new THREE.BoxGeometry(0.52, 0.26, 0.65);
  const cockpitMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
  const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
  cockpit.position.set(0, 0.3, 1.4);
  plane.add(cockpit);

  // Swept Wings
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0.2);
  wingShape.lineTo(3.6, -1.1);
  wingShape.lineTo(3.6, -1.5);
  wingShape.lineTo(0.3, -0.5);
  wingShape.lineTo(-0.3, -0.5);
  wingShape.lineTo(-3.6, -1.5);
  wingShape.lineTo(-3.6, -1.1);
  wingShape.closePath();

  const wingExtrude = new THREE.ExtrudeGeometry(wingShape, { depth: 0.08, bevelEnabled: false });
  wingExtrude.rotateX(Math.PI / 2);
  const wingMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35 });
  const wings = new THREE.Mesh(wingExtrude, wingMat);
  wings.position.set(0, 0, 0.3);
  plane.add(wings);

  // Wingtip navigation strobe lights
  const portLight = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
  portLight.position.set(-3.6, 0, -0.7);
  plane.add(portLight);

  const starLight = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
  starLight.position.set(3.6, 0, -0.7);
  plane.add(starLight);

  // Twin Jet Engines
  const engineGeo = new THREE.CylinderGeometry(0.28, 0.24, 1.0, 10);
  engineGeo.rotateX(Math.PI / 2);
  const engineMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

  [-1.4, 1.4].forEach((xOff) => {
    const eng = new THREE.Mesh(engineGeo, engineMat);
    eng.position.set(xOff, -0.32, 0.15);
    plane.add(eng);

    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), glowMat);
    glow.position.set(xOff, -0.32, -0.4);
    plane.add(glow);
  });

  // Vertical Tail Fin with Carrier Color
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.lineTo(0, 1.3);
  finShape.lineTo(0.5, 1.3);
  finShape.lineTo(0.9, 0);
  finShape.closePath();

  const finExtrude = new THREE.ExtrudeGeometry(finShape, { depth: 0.08, bevelEnabled: false });
  finExtrude.rotateY(Math.PI / 2);
  const finMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.3 });
  const fin = new THREE.Mesh(finExtrude, finMat);
  fin.position.set(0.04, 0.38, -1.9);
  plane.add(fin);

  // Horizontal Tail
  const hTailGeo = new THREE.BoxGeometry(1.8, 0.06, 0.5);
  const hTail = new THREE.Mesh(hTailGeo, wingMat);
  hTail.position.set(0, 0.12, -1.6);
  plane.add(hTail);

  plane.scale.set(0.95, 0.95, 0.95);
  return plane;
}

// Helper: Floating 3D billboard flight callsign label
function createFlightSpriteLabel(flightNo: string, fare: number): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "rgba(10, 16, 29, 0.88)";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(4, 4, 248, 56, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px 'JetBrains Mono', monospace";
    ctx.fillText(`✈ ${flightNo}`, 16, 38);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 20px 'JetBrains Mono', monospace";
    ctx.fillText(`₹${fare}`, 155, 38);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(11, 2.75, 1);
  return sprite;
}

export const Globe3D: React.FC<{
  onSelectCorridor?: (routeCode: string) => void;
}> = ({ onSelectCorridor }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedFlight, setSelectedFlight] = useState<ActiveFlight | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const autoRotateRef = useRef(autoRotate);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  // Three.js instances ref
  const runtimeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    indiaGroup: THREE.Group;
    flights: ActiveFlight[];
    animId: number;
    isDragging: boolean;
    prevPointer: { x: number; y: number };
    targetRotation: { x: number; y: number };
    currentRotation: { x: number; y: number };
  } | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    const width = container.clientWidth || 880;
    const height = container.clientHeight || 580;

    // 1. Scene & Camera (Isometric perspective looking down on India)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 1, 1500);
    camera.position.set(0, 115, 135);
    camera.lookAt(0, 5, 5);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 3. Lighting (High-tech cyan/blue atmosphere)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
    sunLight.position.set(100, 150, 100);
    scene.add(sunLight);

    const cyanRim = new THREE.DirectionalLight(0x38bdf8, 1.4);
    cyanRim.position.set(-80, 60, -60);
    scene.add(cyanRim);

    // 4. India Root Group
    const indiaGroup = new THREE.Group();
    scene.add(indiaGroup);

    // 5. Ocean / Radar Floor Base (Circular Grid)
    const floorRadius = 110;
    const floorGeo = new THREE.CylinderGeometry(floorRadius, floorRadius, 1.2, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x050a14,
      roughness: 0.8,
      metalness: 0.2,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -0.6;
    indiaGroup.add(floorMesh);

    // Radar Concentric Circles on Ocean Floor
    [35, 65, 95, 120].forEach((rad) => {
      const ringGeo = new THREE.RingGeometry(rad - 0.25, rad + 0.25, 64);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x1e293b,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = 0.05;
      indiaGroup.add(ring);
    });

    // 6. Extruded 3D Landmass of India
    const indiaShape = new THREE.Shape();
    INDIA_BORDER_COORDS.forEach(([lon, lat], idx) => {
      const x = (lon - CENTER_LON) * SCALE;
      const y = (lat - CENTER_LAT) * SCALE;
      if (idx === 0) indiaShape.moveTo(x, y);
      else indiaShape.lineTo(x, y);
    });

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: ELEVATION,
      bevelEnabled: true,
      bevelThickness: 0.8,
      bevelSize: 0.6,
      bevelSegments: 2,
    };

    const indiaGeo = new THREE.ExtrudeGeometry(indiaShape, extrudeSettings);
    indiaGeo.rotateX(-Math.PI / 2); // Lay flat on XZ plane, extrude upwards along +Y

    const indiaMat = new THREE.MeshStandardMaterial({
      color: 0x0c1729,
      roughness: 0.4,
      metalness: 0.25,
      emissive: 0x050c18,
      emissiveIntensity: 0.4,
    });
    const indiaMesh = new THREE.Mesh(indiaGeo, indiaMat);
    indiaGroup.add(indiaMesh);

    // Glowing Neon Border line around India's perimeter
    const borderPoints: THREE.Vector3[] = [];
    INDIA_BORDER_COORDS.forEach(([lon, lat]) => {
      borderPoints.push(geoToVector3(lat, lon, ELEVATION + 0.85));
    });
    const borderGeo = new THREE.BufferGeometry().setFromPoints(borderPoints);
    const borderMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2, transparent: true, opacity: 0.9 });
    const borderLine = new THREE.Line(borderGeo, borderMat);
    indiaGroup.add(borderLine);

    // Interior Subcontinent Geodetic Grid Lines
    const gridMat = new THREE.LineBasicMaterial({ color: 0x1e293b, transparent: true, opacity: 0.35 });
    for (let lat = 12; lat <= 32; lat += 4) {
      const linePts = [geoToVector3(lat, 70, ELEVATION + 0.1), geoToVector3(lat, 92, ELEVATION + 0.1)];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
      indiaGroup.add(new THREE.Line(lineGeo, gridMat));
    }
    for (let lon = 72; lon <= 90; lon += 4) {
      const linePts = [geoToVector3(10, lon, ELEVATION + 0.1), geoToVector3(34, lon, ELEVATION + 0.1)];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
      indiaGroup.add(new THREE.Line(lineGeo, gridMat));
    }

    // 7. Indian Airport Hubs (ATC Runway Pads & Glowing Beacons)
    Object.values(INDIAN_HUBS).forEach((hub) => {
      const hubPos = geoToVector3(hub.lat, hub.lon, ELEVATION + 0.1);

      // Runway Landing Circle
      const padGeo = new THREE.RingGeometry(0.8, 2.8, 24);
      padGeo.rotateX(-Math.PI / 2);
      const padMat = new THREE.MeshBasicMaterial({
        color: hub.status === "high_traffic" ? 0x38bdf8 : 0x0ea5e9,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.copy(hubPos);
      indiaGroup.add(pad);

      // ATC Control Tower Mesh
      const towerHeight = hub.status === "high_traffic" ? 5.5 : 3.8;
      const towerGeo = new THREE.CylinderGeometry(0.35, 0.55, towerHeight, 8);
      const towerMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7 });
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(hubPos.x, ELEVATION + towerHeight / 2, hubPos.z);
      indiaGroup.add(tower);

      // Glowing Vertical Beacon Beam into sky
      const beamHeight = hub.status === "high_traffic" ? 18 : 12;
      const beamGeo = new THREE.CylinderGeometry(0.12, 0.5, beamHeight, 8, 1, true);
      beamGeo.translate(0, beamHeight / 2, 0);
      const beamMat = new THREE.MeshBasicMaterial({
        color: hub.status === "high_traffic" ? 0x38bdf8 : 0x0284c7,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.copy(hubPos);
      indiaGroup.add(beam);

      // Airport Code Billboard Sprite Tag
      const tagCanvas = document.createElement("canvas");
      tagCanvas.width = 128;
      tagCanvas.height = 48;
      const tagCtx = tagCanvas.getContext("2d");
      if (tagCtx) {
        tagCtx.fillStyle = hub.status === "high_traffic" ? "#0284c7" : "#0f172a";
        tagCtx.strokeStyle = "#38bdf8";
        tagCtx.lineWidth = 2;
        tagCtx.beginPath();
        tagCtx.roundRect(4, 4, 120, 40, 6);
        tagCtx.fill();
        tagCtx.stroke();

        tagCtx.fillStyle = "#ffffff";
        tagCtx.font = "bold 22px 'JetBrains Mono', monospace";
        tagCtx.textAlign = "center";
        tagCtx.fillText(hub.code, 64, 30);
      }
      const tagTexture = new THREE.CanvasTexture(tagCanvas);
      const tagSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tagTexture, transparent: true, depthTest: false }));
      tagSprite.scale.set(6, 2.2, 1);
      tagSprite.position.set(hubPos.x, ELEVATION + towerHeight + 2.2, hubPos.z);
      indiaGroup.add(tagSprite);
    });

    // 8. 3D Flight Corridor Arcs & Airliner Models Across India
    const flightsList: ActiveFlight[] = [];

    CORRIDORS.forEach((corridor, idx) => {
      const fromHub = INDIAN_HUBS[corridor.from];
      const toHub = INDIAN_HUBS[corridor.to];
      if (!fromHub || !toHub) return;

      const p1 = geoToVector3(fromHub.lat, fromHub.lon, ELEVATION + 0.6);
      const p2 = geoToVector3(toHub.lat, toHub.lon, ELEVATION + 0.6);

      // Parabolic Arc Apex
      const midX = (p1.x + p2.x) / 2;
      const midZ = (p1.z + p2.z) / 2;
      const dist = Math.hypot(p2.x - p1.x, p2.z - p1.z);
      const apexY = ELEVATION + 14 + dist * 0.38;
      const ctrlPt = new THREE.Vector3(midX, apexY, midZ);

      const curve = new THREE.QuadraticBezierCurve3(p1, ctrlPt, p2);

      // 3D Tubular Glowing Flight Arc
      const tubeGeo = new THREE.TubeGeometry(curve, 36, 0.45, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(corridor.color),
        transparent: true,
        opacity: 0.75,
      });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      indiaGroup.add(tube);

      // 3D Airplane Mesh
      const airline = AIRLINES[idx % AIRLINES.length];
      const planeMesh = createAirplaneModel(airline.color);
      indiaGroup.add(planeMesh);

      // Floating Flight Tag Billboard
      const spriteLabel = createFlightSpriteLabel(`${airline.code}-${100 + ((idx * 73) % 899)}`, corridor.currentFare);
      indiaGroup.add(spriteLabel);

      // Glowing Contrail Ribbon
      const trailGeo = new THREE.BufferGeometry();
      const trailMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(corridor.color),
        transparent: true,
        opacity: 0.85,
      });
      const trailLine = new THREE.Line(trailGeo, trailMat);
      indiaGroup.add(trailLine);

      flightsList.push({
        id: `FLIGHT-${corridor.id}`,
        airline: airline.code,
        airlineName: airline.name,
        flightNo: `${airline.code}-${100 + ((idx * 73) % 899)}`,
        from: corridor.from,
        to: corridor.to,
        fare: corridor.currentFare,
        fairFareScore: 82 + (idx * 3) % 15,
        altitude: `${33000 + (idx % 6) * 1200} ft (FL${330 + (idx % 6) * 12})`,
        speed: `${835 + (idx % 5) * 16} km/h`,
        progress: (idx * 0.16) % 1.0,
        speedRate: 0.0016 + (idx % 3) * 0.0003,
        curve,
        mesh: planeMesh,
        tailTrail: trailLine,
        spriteLabel,
      });
    });

    // Default select Golden Corridor DEL-BOM
    setSelectedFlight(flightsList[0]);

    // Store state in ref
    runtimeRef.current = {
      scene,
      camera,
      renderer,
      indiaGroup,
      flights: flightsList,
      animId: 0,
      isDragging: false,
      prevPointer: { x: 0, y: 0 },
      targetRotation: { x: 0, y: 0 },
      currentRotation: { x: 0, y: 0 },
    };

    // 9. Pointer Drag & Orbit Controls
    const dom = renderer.domElement;
    dom.style.touchAction = "none";

    const onPointerDown = (e: PointerEvent) => {
      if (!runtimeRef.current) return;
      runtimeRef.current.isDragging = true;
      runtimeRef.current.prevPointer = { x: e.clientX, y: e.clientY };
      dom.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!runtimeRef.current || !runtimeRef.current.isDragging) return;
      const dx = e.clientX - runtimeRef.current.prevPointer.x;
      const dy = e.clientY - runtimeRef.current.prevPointer.y;

      runtimeRef.current.targetRotation.y += dx * 0.006;
      runtimeRef.current.targetRotation.x = Math.max(
        -0.45,
        Math.min(0.35, runtimeRef.current.targetRotation.x + dy * 0.006)
      );

      runtimeRef.current.prevPointer = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!runtimeRef.current) return;
      runtimeRef.current.isDragging = false;
      try {
        dom.releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!runtimeRef.current) return;
      camera.position.y = Math.max(65, Math.min(185, camera.position.y + e.deltaY * 0.08));
      camera.position.z = Math.max(80, Math.min(220, camera.position.z + e.deltaY * 0.1));
      camera.lookAt(0, 5, 5);
    };

    dom.addEventListener("pointerdown", onPointerDown);
    dom.addEventListener("pointermove", onPointerMove);
    dom.addEventListener("pointerup", onPointerUp);
    dom.addEventListener("pointercancel", onPointerUp);
    dom.addEventListener("wheel", onWheel, { passive: false });

    // 10. Animation Render Loop
    const animate = () => {
      if (!runtimeRef.current) return;

      // Gentle auto rotation orbit when not dragging
      if (autoRotateRef.current && !runtimeRef.current.isDragging) {
        runtimeRef.current.targetRotation.y += 0.001;
      }

      // Smooth damping
      runtimeRef.current.currentRotation.x +=
        (runtimeRef.current.targetRotation.x - runtimeRef.current.currentRotation.x) * 0.08;
      runtimeRef.current.currentRotation.y +=
        (runtimeRef.current.targetRotation.y - runtimeRef.current.currentRotation.y) * 0.08;

      indiaGroup.rotation.x = runtimeRef.current.currentRotation.x;
      indiaGroup.rotation.y = runtimeRef.current.currentRotation.y;

      // Update 3D Flights
      flightsList.forEach((flight) => {
        flight.progress = (flight.progress + flight.speedRate) % 1;
        const pos = flight.curve.getPointAt(flight.progress);
        flight.mesh.position.copy(pos);

        // Billboard text label above flight
        flight.spriteLabel.position.set(pos.x, pos.y + 4.2, pos.z);

        // Align aircraft nose along trajectory tangent
        const tangent = flight.curve.getTangentAt(flight.progress).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(up, tangent).normalize();
        const correctedUp = new THREE.Vector3().crossVectors(tangent, right).normalize();

        const matrix = new THREE.Matrix4();
        matrix.makeBasis(right, correctedUp, tangent);
        flight.mesh.quaternion.setFromRotationMatrix(matrix);

        // Contrail line behind jet
        const trailPts: THREE.Vector3[] = [];
        for (let i = 0; i < 10; i++) {
          const tPrev = Math.max(0, flight.progress - i * 0.01);
          trailPts.push(flight.curve.getPointAt(tPrev));
        }
        flight.tailTrail.geometry.setFromPoints(trailPts);
      });

      renderer.render(scene, camera);
      runtimeRef.current.animId = requestAnimationFrame(animate);
    };

    animate();

    // 11. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0 && runtimeRef.current) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      dom.removeEventListener("pointerdown", onPointerDown);
      dom.removeEventListener("pointermove", onPointerMove);
      dom.removeEventListener("pointerup", onPointerUp);
      dom.removeEventListener("pointercancel", onPointerUp);
      dom.removeEventListener("wheel", onWheel);

      if (runtimeRef.current) {
        cancelAnimationFrame(runtimeRef.current.animId);
        renderer.dispose();
        if (dom.parentElement) {
          dom.parentElement.removeChild(dom);
        }
      }
    };
  }, []);

  // Focus on a specific corridor
  const handleFocusCorridor = (routeId: string) => {
    if (!runtimeRef.current) return;
    const flight = runtimeRef.current.flights.find((f) => f.id === `FLIGHT-${routeId}`);
    if (flight) {
      setSelectedFlight(flight);
    }
    if (onSelectCorridor) onSelectCorridor(routeId);
  };

  // Reset to default India perspective
  const handleResetToIndia = () => {
    if (!runtimeRef.current) return;
    runtimeRef.current.targetRotation = { x: 0, y: 0 };
    runtimeRef.current.camera.position.set(0, 115, 135);
    runtimeRef.current.camera.lookAt(0, 5, 5);
  };

  return (
    <div className="globe-visual-card">
      {/* Visual Header */}
      <div className="globe-header">
        <div>
          <div className="globe-badge">
            <Radio size={13} className="animate-pulse" style={{ color: "#38bdf8" }} />
            <span>3D INDIA DOMESTIC AIRSPACE RADAR</span>
            <span className="live-pill">100% INDIA FOCUSED</span>
          </div>
          <h2 className="globe-title">Interactive 3D Indian Civil Aviation Network</h2>
          <p className="globe-subtitle">
            A policy-grade 3D digital twin of India's domestic airspace. Track live commercial airliners cruising across the 10 DGCA trunk corridors with high-altitude 3D flight arcs.
          </p>
        </div>

        {/* View Controls */}
        <div className="globe-controls">
          <button
            className={`btn-control ${autoRotate ? "active" : ""}`}
            onClick={() => setAutoRotate(!autoRotate)}
            title="Toggle India Orbit Motion"
          >
            <Compass size={14} /> {autoRotate ? "Auto-Orbit ON" : "Fixed Angle"}
          </button>
          <button
            className="btn-control"
            onClick={handleResetToIndia}
            title="Reset to India Subcontinent Perspective"
          >
            <RefreshCw size={14} /> Center India
          </button>
        </div>
      </div>

      {/* 3D Canvas Viewport */}
      <div className="globe-canvas-wrapper" style={{ position: "relative", width: "100%", height: "580px", overflow: "hidden" }}>
        <div ref={mountRef} style={{ width: "100%", height: "100%", cursor: "grab" }} />

        {/* Live Airborne Telemetry HUD Overlay */}
        {selectedFlight && (
          <div className="globe-hud-overlay">
            <div className="hud-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div className="hud-radar-blip" />
                <span className="hud-callsign">{selectedFlight.flightNo}</span>
                <span className="hud-carrier-tag">{selectedFlight.airlineName}</span>
              </div>
              <span className="hud-status-badge">EN ROUTE</span>
            </div>

            <div className="hud-body">
              <div className="hud-route-row">
                <div className="hud-city">
                  <div className="hud-city-code">{selectedFlight.from}</div>
                  <div className="hud-city-name">{INDIAN_HUBS[selectedFlight.from]?.city}</div>
                </div>
                <div className="hud-flight-arrow">
                  <Plane size={15} style={{ transform: "rotate(90deg)", color: "#38bdf8" }} />
                  <div className="hud-line" />
                </div>
                <div className="hud-city">
                  <div className="hud-city-code">{selectedFlight.to}</div>
                  <div className="hud-city-name">{INDIAN_HUBS[selectedFlight.to]?.city}</div>
                </div>
              </div>

              <div className="hud-stats-grid">
                <div className="hud-stat-item">
                  <span className="hud-stat-label">Altitude</span>
                  <span className="hud-stat-val">{selectedFlight.altitude}</span>
                </div>
                <div className="hud-stat-item">
                  <span className="hud-stat-label">Groundspeed</span>
                  <span className="hud-stat-val">{selectedFlight.speed}</span>
                </div>
                <div className="hud-stat-item">
                  <span className="hud-stat-label">Observed Fare</span>
                  <span className="hud-stat-val" style={{ color: "#38bdf8" }}>₹{selectedFlight.fare.toLocaleString()}</span>
                </div>
                <div className="hud-stat-item">
                  <span className="hud-stat-label">Fair Fare Score</span>
                  <span className="hud-stat-val" style={{ color: "#10b981" }}>{selectedFlight.fairFareScore}/100 🟢</span>
                </div>
              </div>
            </div>

            <div className="hud-footer">
              <span>💡 Drag to orbit India in 3D • Scroll to zoom • Click routes below</span>
            </div>
          </div>
        )}

        {/* Airport Quick Selector Bar */}
        <div className="globe-quick-hubs">
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", padding: "0 4px" }}>
            DGCA Corridors:
          </span>
          {CORRIDORS.slice(0, 8).map((c) => (
            <button
              key={c.id}
              className={`hub-pill-btn ${selectedFlight?.from === c.from && selectedFlight?.to === c.to ? "active" : ""}`}
              onClick={() => handleFocusCorridor(c.id)}
            >
              <span>{c.id}</span>
              <span className="pill-fare">₹{c.currentFare}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Corridor Metric Row */}
      <div className="globe-bottom-row">
        <div className="globe-metric-col">
          <span className="col-label">National Coverage</span>
          <span className="col-val">10 DGCA Tracked Corridors</span>
          <span className="col-sub">100% of National Passenger Volume Weights</span>
        </div>
        <div className="globe-metric-col">
          <span className="col-label">Airports Instrumented</span>
          <span className="col-val">Delhi • Mumbai • Bengaluru • Chennai • Hyderabad</span>
          <span className="col-sub">+ Kolkata, Ahmedabad, Goa, Pune, Kochi</span>
        </div>
        <div className="globe-metric-col">
          <span className="col-label">Fleet Calibration</span>
          <span className="col-val">IndiGo • Air India • Akasa • SpiceJet</span>
          <span className="col-sub">Direct Airline Adapters & Open Data</span>
        </div>
      </div>
    </div>
  );
};
