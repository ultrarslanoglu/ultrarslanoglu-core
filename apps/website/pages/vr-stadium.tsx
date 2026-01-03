import { useEffect, useRef } from 'react';
import type { NextPage } from 'next';
import * as THREE from 'three';

const VRStadiumPage: NextPage = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mountRef.current) return;

    const container = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080c16);

    const disposableGeometries: THREE.BufferGeometry[] = [];
    const disposableMaterials: THREE.Material[] = [];

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(
      75,
      (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
      0.1,
      500
    );
    camera.position.set(0, 1.6, 10);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 25, 5);
    scene.add(dirLight);

    // Stadium shell (inside a dome)
    const domeGeometry = new THREE.SphereGeometry(120, 64, 64);
    const domeMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f1a33,
      roughness: 0.8,
      metalness: 0.05,
      side: THREE.BackSide
    });
    disposableGeometries.push(domeGeometry);
    disposableMaterials.push(domeMaterial);
    const dome = new THREE.Mesh(domeGeometry, domeMaterial);
    scene.add(dome);

    // Pitch
    const pitch = new THREE.Mesh(
      new THREE.CircleGeometry(18, 64),
      new THREE.MeshStandardMaterial({ color: 0x0d3814, roughness: 0.7 })
    );
    disposableGeometries.push(pitch.geometry as THREE.BufferGeometry);
    disposableMaterials.push(pitch.material as THREE.Material);
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.y = 0;
    scene.add(pitch);

    // Track line for orientation
    const trackRing = new THREE.Mesh(
      new THREE.RingGeometry(19.5, 20, 72, 1),
      new THREE.MeshBasicMaterial({ color: 0x6dd3ff, side: THREE.DoubleSide, transparent: true, opacity: 0.3 })
    );
    disposableGeometries.push(trackRing.geometry as THREE.BufferGeometry);
    disposableMaterials.push(trackRing.material as THREE.Material);
    trackRing.rotation.x = -Math.PI / 2;
    trackRing.position.y = 0.02;
    scene.add(trackRing);

    // Flood lights
    const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    disposableMaterials.push(lightMaterial);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.3, 14, 8),
        new THREE.MeshStandardMaterial({ color: 0x9fb6d4, metalness: 0.3, roughness: 0.4 })
      );
      disposableGeometries.push(mast.geometry as THREE.BufferGeometry);
      disposableMaterials.push(mast.material as THREE.Material);
      mast.position.set(Math.cos(angle) * 28, 7, Math.sin(angle) * 28);
      scene.add(mast);

      const lamp = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 0.4), lightMaterial);
      disposableGeometries.push(lamp.geometry as THREE.BufferGeometry);
      lamp.position.set(Math.cos(angle) * 28, 14, Math.sin(angle) * 28);
      scene.add(lamp);
    }

    // Fan avatars
    const fanColors = [0xfcc419, 0xff6b6b, 0x74c0fc, 0xf06595, 0x4dabf7];
    const fans: THREE.Object3D[] = [];
    const makeFan = (angle: number, radius: number) => {
      const group = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.45, 1.3, 12),
        new THREE.MeshStandardMaterial({ color: fanColors[Math.floor(Math.random() * fanColors.length)], roughness: 0.6 })
      );
      disposableGeometries.push(body.geometry as THREE.BufferGeometry);
      disposableMaterials.push(body.material as THREE.Material);
      body.position.y = 0.65;
      group.add(body);

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xffe0bd, roughness: 0.5 })
      );
      disposableGeometries.push(head.geometry as THREE.BufferGeometry);
      disposableMaterials.push(head.material as THREE.Material);
      head.position.y = 1.4;
      group.add(head);

      const scarf = new THREE.Mesh(
        new THREE.TorusGeometry(0.28, 0.06, 8, 20),
        new THREE.MeshStandardMaterial({ color: 0xd9480f })
      );
      disposableGeometries.push(scarf.geometry as THREE.BufferGeometry);
      disposableMaterials.push(scarf.material as THREE.Material);
      scarf.position.y = 1.05;
      scarf.rotation.x = Math.PI / 2;
      group.add(scarf);

      group.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      group.lookAt(0, 1.2, 0);
      scene.add(group);
      fans.push(group);
    };

    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2 + Math.random() * 0.2;
      makeFan(angle, 24 + Math.random() * 4);
    }

    // Camera controls
    const look = { yaw: 0, pitch: 0 };
    const keys = new Set<string>();
    const clock = new THREE.Clock();
    let animationId = 0;
    let pointerLocked = false;

    const updateSize = () => {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      keys.add(event.code);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      keys.delete(event.code);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!pointerLocked) return;
      look.yaw -= event.movementX * 0.002;
      look.pitch -= event.movementY * 0.002;
      look.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, look.pitch));
    };

    const onPointerLockChange = () => {
      pointerLocked = document.pointerLockElement === container;
    };

    const onClick = () => {
      container.requestPointerLock();
    };

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const moveSpeed = 7;
      const move = new THREE.Vector3();

      const forward = new THREE.Vector3(Math.sin(look.yaw), 0, Math.cos(look.yaw));
      const right = new THREE.Vector3(Math.cos(look.yaw), 0, -Math.sin(look.yaw));

      if (keys.has('KeyW')) move.add(forward);
      if (keys.has('KeyS')) move.sub(forward);
      if (keys.has('KeyA')) move.sub(right);
      if (keys.has('KeyD')) move.add(right);

      if (move.lengthSq() > 0) {
        move.normalize();
        camera.position.addScaledVector(move, delta * moveSpeed);
      }

      // Boundary clamp
      const radiusLimit = 32;
      const horizontalRadius = Math.hypot(camera.position.x, camera.position.z);
      if (horizontalRadius > radiusLimit) {
        const scale = radiusLimit / horizontalRadius;
        camera.position.x *= scale;
        camera.position.z *= scale;
      }
      camera.position.y = Math.min(3, Math.max(1.2, camera.position.y));

      camera.rotation.set(look.pitch, look.yaw, 0);
      renderer.render(scene, camera);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    container.addEventListener('click', onClick);

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      container.removeEventListener('click', onClick);

      fans.forEach((fan) => scene.remove(fan));
      scene.clear();
      renderer.dispose();
      disposableGeometries.forEach((geo) => geo.dispose());
      disposableMaterials.forEach((mat) => mat.dispose());
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="absolute inset-0" ref={mountRef} />
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6">
        <div className="max-w-lg rounded-lg bg-black/40 p-4 backdrop-blur">
          <h1 className="text-2xl font-semibold">360° Stadyum VR</h1>
          <p className="mt-2 text-sm text-slate-200">
            Sahneyi görmek ve kamerayı çevirmek için ekrana tıkla. WASD ile zeminde dolaş, fare ile etrafa bak.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-200">
          <span className="rounded bg-white/10 px-2 py-1">WASD: Hareket</span>
          <span className="rounded bg-white/10 px-2 py-1">Mouse: Etrafına bak</span>
          <span className="rounded bg-white/10 px-2 py-1">Tıkla: Pointer Lock</span>
        </div>
      </div>
    </div>
  );
};

export default VRStadiumPage;
