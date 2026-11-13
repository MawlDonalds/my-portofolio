import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useGLTF, ContactShadows } from '@react-three/drei';
import { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import { Box3, Vector3, Group, Plane, Raycaster } from 'three';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import gsap from 'gsap';

function AlphabetBoxes({ offsetX, offsetY, isMobile }) {
    const { scene } = useGLTF('/models/alphabet-boxes.glb');
    const rbRefs = useRef({});
    const boxRefs = useRef([]);
    const [draggingId, setDraggingId] = useState(null);
    const [hoveredId, setHoveredId] = useState(null);
    const [isIntro, setIsIntro] = useState(true);
    const dragOffset = useRef(new Vector3());

    const dragPlane = useRef(new Plane(new Vector3(0, 0, 1), 0));
    const raycaster = useRef(new Raycaster());
    const targetPoint = useRef(new Vector3());
    const { camera, pointer, viewport } = useThree();

    const boxes = useMemo(() => {
        const names = ['M', 'A', 'W', 'L'];
        // Di HP ukuran kotak otomatis diperkecil agar proporsional
        const targetHeight = isMobile ? 0.6 : 1;

        return names.map((name) => {
            const source = scene.getObjectByName(name);
            if (!source) return null;

            const object = source.clone(true);
            const wrapper = new Group();
            wrapper.add(object);
            wrapper.updateMatrixWorld(true);

            const bounds = new Box3().setFromObject(wrapper);
            const center = new Vector3();
            const size = new Vector3();
            bounds.getCenter(center);
            bounds.getSize(size);

            object.position.sub(center);

            const scale = targetHeight / size.y;
            wrapper.scale.setScalar(scale);

            wrapper.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            return {
                name,
                object: wrapper,
                width: size.x * scale,
                height: size.y * scale,
                depth: size.z * scale,
            };
        }).filter(Boolean);
    }, [scene, isMobile]);

    const layout = useMemo(() => {
        const find = (name) => boxes.find((b) => b.name === name);

        const M = find('M');
        const A = find('A');
        const W = find('W');
        const L = find('L');

        if (!M || !A || !W || !L) return [];

        const gap = 0.04;
        const bottomY = M.height / 2;

        return [
            {
                box: M,
                position: [
                    -(M.width / 2 + gap / 2),
                    bottomY,
                    0,
                ],
            },
            {
                box: A,
                position: [
                    A.width / 2 + gap / 2,
                    bottomY,
                    0,
                ],
            },
            {
                box: W,
                position: [
                    0,
                    M.height + W.height / 2,
                    0.05,
                ],
            },
            {
                box: L,
                position: [
                    0,
                    M.height + W.height + L.height / 2,
                    0.1,
                ],
            },
        ];
    }, [boxes]);

    useEffect(() => {
        setIsIntro(true);
        const groups = boxRefs.current.filter(Boolean);
        if (!groups.length) return;

        const positions = groups.map((obj) => obj.position);
        positions.forEach((pos) => {
            pos.y = 5;
        });

        const tween = gsap.to(positions, {
            y: 0,
            duration: 0.8,
            stagger: 0.25,
            ease: 'bounce.out',
            delay: 0.05,
            onComplete: () => {
                setIsIntro(false);
            },
        });

        return () => {
            tween.kill();
        };
    }, [layout]);

    useEffect(() => {
        if (draggingId) {
            document.body.style.cursor = 'grabbing';
        } else if (hoveredId) {
            document.body.style.cursor = 'grab';
        } else {
            document.body.style.cursor = 'auto';
        }
        return () => {
            document.body.style.cursor = 'auto';
        };
    }, [draggingId, hoveredId]);

    useEffect(() => {
        const handleMouseUp = () => setDraggingId(null);
        window.addEventListener('pointerup', handleMouseUp);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchend', handleMouseUp);
        return () => {
            window.removeEventListener('pointerup', handleMouseUp);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, []);

    useFrame(() => {
        if (!draggingId || !rbRefs.current[draggingId]) return;

        const rb = rbRefs.current[draggingId];
        rb.wakeUp();

        raycaster.current.setFromCamera(pointer, camera);
        const hit = raycaster.current.ray.intersectPlane(dragPlane.current, targetPoint.current);

        if (hit) {
            const currentPos = rb.translation();
            const desiredX = targetPoint.current.x + dragOffset.current.x;
            const minWorldY = offsetY + 0.45;
            const desiredY = Math.max(minWorldY, targetPoint.current.y + dragOffset.current.y);

            rb.setLinvel(
                {
                    x: (desiredX - currentPos.x) * 18,
                    y: (desiredY - currentPos.y) * 18,
                    z: 0,
                },
                true
            );

            const angVel = rb.angvel();
            rb.setAngvel({ x: 0, y: 0, z: angVel.z * 0.8 }, true);
        }
    });

    const leftWallX = -viewport.width / 2 - offsetX - 0.3;
    const rightWallX = viewport.width / 2 - offsetX + 0.3;

    return (
        <group>
            <RigidBody type="fixed" position={[0, -0.1, 0]} friction={1}>
                <CuboidCollider args={[50, 0.1, 25]} />
            </RigidBody>

            <RigidBody type="fixed" position={[leftWallX, 0, 0]}>
                <CuboidCollider args={[0.2, 15, 2.5]} />
            </RigidBody>
            <RigidBody type="fixed" position={[rightWallX, 0, 0]}>
                <CuboidCollider args={[0.2, 15, 2.5]} />
            </RigidBody>

            {layout.map(({ box, position }, index) => (
                <RigidBody
                    key={`${box.name}-${isMobile ? 'm' : 'd'}`}
                    ref={(el) => (rbRefs.current[box.name] = el)}
                    type={isIntro ? 'fixed' : 'dynamic'}
                    colliders={false}
                    position={[position[0], position[1], 0]}
                    restitution={0.15}
                    friction={0.9}
                    linearDamping={1.5}
                    angularDamping={2.5}
                    enabledTranslations={[true, true, false]}
                    enabledRotations={[false, false, true]}
                    ccd={true}
                    onPointerOver={(e) => {
                        e.stopPropagation();
                        setHoveredId(box.name);
                    }}
                    onPointerOut={() => {
                        setHoveredId((prev) => (prev === box.name ? null : prev));
                    }}
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        if (isIntro) return;
                        const rb = rbRefs.current[box.name];
                        if (rb) {
                            raycaster.current.setFromCamera(pointer, camera);
                            if (raycaster.current.ray.intersectPlane(dragPlane.current, targetPoint.current)) {
                                const pos = rb.translation();
                                dragOffset.current.set(
                                    pos.x - targetPoint.current.x,
                                    pos.y - targetPoint.current.y,
                                    0
                                );
                            }
                        }
                        setDraggingId(box.name);
                    }}
                >
                    <CuboidCollider args={[box.width / 2, box.height / 2, box.depth / 2]} />
                    <group
                        ref={(el) => (boxRefs.current[index] = el)}
                        position={[0, 4, position[2]]}
                    >
                        <primitive object={box.object} />
                    </group>
                </RigidBody>
            ))}
        </group>
    );
}

function Scene() {
    const { viewport } = useThree();
    // Jika lebar viewport 3D < 5.5 unit berarti layar HP/portrait
    const isMobile = viewport.width < 5.5;
    const offsetX = isMobile ? 0 : 1.8;
    const offsetY = isMobile ? -2.3 : -1.2;

    return (
        <group position={[offsetX, offsetY, 0]}>
            <ambientLight intensity={1.5} />
            <directionalLight position={[4, 8, 6]} intensity={2.5} />

            <Physics gravity={[0, -18, 0]}>
                <AlphabetBoxes offsetX={offsetX} offsetY={offsetY} isMobile={isMobile} />
            </Physics>

            <ContactShadows
                position={[-offsetX, -0.01, 0]}
                opacity={0.75}
                scale={28}
                blur={2.5}
                far={6}
            />
        </group>
    );
}

export default function ProfileScene() {
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <Canvas
                camera={{ position: [0, 0, 8.5], fov: 45 }}
                shadows
                gl={{ alpha: true, antialias: true }}
                style={{ width: '100%', height: '100%', touchAction: 'none' }}
            >
                <Suspense fallback={null}>
                    <Scene />
                </Suspense>
            </Canvas>
        </div>
    );
}

useGLTF.preload('/models/alphabet-boxes.glb');