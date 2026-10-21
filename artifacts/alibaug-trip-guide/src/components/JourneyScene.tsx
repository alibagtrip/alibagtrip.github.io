import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { days } from '@/data/itinerary';

export default function JourneyScene({ dayId }: { dayId: number }) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const root = host.current;
    if (!root) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.4));
    renderer.setSize(root.clientWidth, root.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    root.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#8dd7d5');
    scene.fog = new THREE.Fog('#8dd7d5', 15, 38);
    const camera = new THREE.PerspectiveCamera(38, root.clientWidth / root.clientHeight, .1, 80);
    camera.position.set(0, 8, 16);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight('#fff8e9', '#477b79', 2));
    const sun = new THREE.DirectionalLight('#fff1d3', 2.2);
    sun.position.set(-5, 10, 6);
    scene.add(sun);
    const mat = (color: string, roughness = .8) => new THREE.MeshStandardMaterial({ color, roughness });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), mat('#65bfc4'));
    water.rotation.x = -Math.PI / 2;
    water.position.y = -.7;
    scene.add(water);
    const island = new THREE.Group();
    scene.add(island);
    const sand = mat('#f2d8b6');
    const shore = new THREE.Mesh(new THREE.SphereGeometry(6.4, 48, 32), sand);
    shore.scale.set(1.5, .21, .79);
    shore.position.set(0, -.1, 0);
    island.add(shore);
    const innerDune = new THREE.Mesh(new THREE.SphereGeometry(4.5, 32, 24), mat('#e6bf93'));
    innerDune.scale.set(1.45, .18, .72);
    innerDune.position.set(-.6, .38, -.15);
    island.add(innerDune);
    const day = days[Math.max(0, Math.min(days.length - 1, dayId - 1))];
    const count = Math.min(day.stops.length, 8);
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / Math.max(1, count - 1)) * Math.PI * 1.24 - Math.PI * .66;
      const x = Math.cos(angle) * 4.5;
      const z = Math.sin(angle) * 2.2;
      const point = new THREE.Vector3(x, .55, z);
      points.push(point);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(.065, .095, .65, 10), mat('#a86b48'));
      stem.position.set(x, .36, z);
      island.add(stem);
      const head = new THREE.Mesh(new THREE.SphereGeometry(.19, 18, 14), mat(day.color));
      head.position.set(x, .78, z);
      island.add(head);
      const number = new THREE.Mesh(new THREE.SphereGeometry(.055, 12, 10), mat('#fff8e9'));
      number.position.set(x, .78, z + .17);
      island.add(number);
    }
    if (points.length > 1) {
      const route = new THREE.CatmullRomCurve3(points);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(route, 80, .035, 6, false), mat('#fff7df', .4));
      tube.position.y = -.05;
      island.add(tube);
    }
    const fort = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(.23, .29, .8 + (i % 2) * .2, 8), mat('#d59b70'));
      tower.position.set(-1.1 + i * .42, .75, -.3);
      fort.add(tower);
    }
    island.add(fort);
    const lighthouse = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.14, .27, 1.35, 12), mat('#f8f2e4'));
    base.position.y = .9;
    lighthouse.add(base);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(.22, .38, 12), mat('#f2546f'));
    cap.position.y = 1.76;
    lighthouse.add(cap);
    lighthouse.position.set(5.3, 0, -1.5);
    island.add(lighthouse);
    const palmMat = mat('#578b68');
    [-4.8, 4.1].forEach((x, i) => {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.08, .13, 1.8, 10), mat('#a86b48'));
      trunk.position.set(x, .85, i ? 1.45 : -1.75);
      island.add(trunk);
      for (let leaf = 0; leaf < 5; leaf++) {
        const frond = new THREE.Mesh(new THREE.CapsuleGeometry(.055, .72, 3, 6), palmMat);
        frond.position.set(x + Math.cos(leaf * 1.25) * .42, 1.72, (i ? 1.45 : -1.75) + Math.sin(leaf * 1.25) * .42);
        frond.rotation.z = Math.cos(leaf * 1.25) * .7;
        frond.rotation.x = Math.sin(leaf * 1.25) * .7;
        island.add(frond);
      }
    });
    let frame = 0;
    let inView = true;
    let alive = true;
    const onResize = () => {
      if (!root.clientWidth || !root.clientHeight) return;
      camera.aspect = root.clientWidth / root.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(root.clientWidth, root.clientHeight);
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(root);
    const render = () => {
      frame = 0;
      if (!alive || !inView || document.hidden) return;
      const t = performance.now() * .00035;
      island.rotation.y = Math.sin(t) * .025;
      shore.scale.y = .21 + Math.sin(t * 2) * .007;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    const syncRender = () => {
      if (!inView || document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else if (!frame) frame = requestAnimationFrame(render);
    };
    const observer = new IntersectionObserver(entries => { inView = entries[0]?.isIntersecting ?? true; syncRender(); });
    observer.observe(root);
    const onVisibility = () => syncRender();
    document.addEventListener('visibilitychange', onVisibility);
    renderer.render(scene, camera);
    syncRender();
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      scene.traverse(node => {
        if (node instanceof THREE.Mesh) {
          node.geometry.dispose();
          if (Array.isArray(node.material)) node.material.forEach(material => material.dispose());
          else node.material.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [dayId]);
  return <section className="section card"><div className="section-head"><div><div className="eyebrow">Journey diorama · Day {dayId}</div><h2>Soft clay, salt water.</h2></div><span className="pill">Stylized positions only</span></div>{failed?<div className="map-fallback">WebGL isn’t available here. The illustrated route poster above remains ready to use.</div>:<div ref={host} className="three-scene" role="img" aria-label={`A stylized 3D Alibaug coast diorama for day ${dayId}. Positions are decorative, not geographic.`}/>}<p className="muted" style={{marginTop:12}}>Island, route and pins are illustrative x/z positions—not real map coordinates.</p></section>;
}
