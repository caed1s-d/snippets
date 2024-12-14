// Удобный прокси с набором команд для работы с воркером
class RpcWorker {
    constructor(path) {
        // используется для последовательного присваивания сообщений id в формате JSON-RPC, которые нужны будут для обрабоки ответов в основном потоке
        this.next_command_id = 0;
        // используется для хранения записей с id команды и содержащать resolve и reject
        this.in_flight_commands = new Map();
        // инкапуслирует логику работы с воркером
        this.worker = new Worker(path);
        // добавляем обработчик, который будет вызываться при получении сообщения от воркера
        this.worker.onmessage = this.onMessageHandler.bind(this);
    }

    exec(method, ...args) {
        const id = ++this.next_command_id;
        let resolve, reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        this.in_flight_commands.set(id, { resolve, reject });
        this.worker.postMessage({ method, params: args, id });
        return promise;
    }

    onMessageHandler(msg) {
        // тут получаем ответ от воркера
        const { result, error, id } = msg.data;
        // тут обрабатываем ответ, доставая из хранилища записей resolve и reject для каждого метода
        const { resolve, reject } = this.in_flight_commands.get(id);
        this.in_flight_commands.delete(id);
        // обрабатываем результат и резолвим/реджектим промис, который уже ждет на вызове exec
        if (error) reject(error);
        else resolve(result);
    }
}
