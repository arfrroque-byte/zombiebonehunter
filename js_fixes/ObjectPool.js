export class ObjectPool {
    constructor(createFunction, initialSize = 30) {
        this.createFunction = createFunction;
        this.pool = [];

        // Cria 30 balas/inimigos invisíveis logo no loading do jogo
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFunction());
        }
    }

    // Pega um item da piscina
    spawn() {
        if (this.pool.length > 0) {
            return this.pool.pop(); // Usa um que já existe
        }
        return this.createFunction(); // Só cria novo se acabarem os da piscina
    }

    // Devolve o item pra piscina (quando a bala bate no zumbi ou sai da tela)
    recycle(item) {
        if (item) {
            item.visible = false; // Esconde do 3D
            if (item.position && item.position.set) {
                item.position.set(0, 0, 0); // Reseta posição
            }
            this.pool.push(item);
        }
    }
}
