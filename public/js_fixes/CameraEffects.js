let shakeTime = 0;
const shakeIntensity = 0.5;
let originalPosition = { x: 0, y: 0, z: 0 };
let originalPositionSaved = false;

// Chame esta função no momento em que a arma disparar
export function triggerCameraShake(camera) {
    shakeTime = 10; // Treme por 10 frames
    if (camera && !originalPositionSaved) {
        originalPosition.x = camera.position.x;
        originalPosition.y = camera.position.y;
        originalPosition.z = camera.position.z;
        originalPositionSaved = true;
    }
}

// Coloque isso dentro da sua função de UPDATE (loop principal do 3D / requestAnimationFrame)
export function updateCameraShake(camera) {
    if (!camera) return;

    if (shakeTime > 0) {
        // Move a câmera aleatoriamente em X e Y
        camera.position.x += (Math.random() - 0.5) * shakeIntensity;
        camera.position.y += (Math.random() - 0.5) * shakeIntensity;
        shakeTime--;
    } else if (originalPositionSaved) {
        // Garante que a câmera volta pro centro/posição normal depois
        // Isso assume uma transição suave de volta ao centro (opcional, aqui um reset simples)
        // Note: Se a câmera se mover pelo jogador (fps), você pode precisar de uma lógica mais avançada
        // camera.position.x = originalPosition.x;
        // camera.position.y = originalPosition.y;
        originalPositionSaved = false;
    }
}
