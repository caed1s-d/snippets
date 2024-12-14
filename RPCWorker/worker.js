const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

function asyncOnMessageWrap(fn) {
    return async function (msg) {
        self.postMessage(await fn(msg.data));
    };
}

// На этом этапе можно также добавить типизацию для методов
const commands = {
    async square_sum(max) {
        await sleep(Math.random() * 100);
        let sum = 0;
        for (let i = 0; i < max; i++) sum += Math.sqrt(i);
        return sum;
    },
    async fibonacci(limit) {
        await sleep(Math.random() * 100);
        let prev = 1n,
            next = 0n,
            swap;
        while (limit) {
            swap = prev;
            prev = prev + next;
            next = swap;
            limit--;
        }
        return String(next);
    },
    async fake_method() {
        await sleep(Math.random() * 100);
        return 'fake result';
    },
    async bad() {
        await sleep(Math.random() * 100);
        throw new Error('bad');
    },
};

self.onmessage = asyncOnMessageWrap(async (rpc) => {
    const { method, params, id } = rpc;
    if (commands.hasOwnProperty(method)) {
        try {
            const result = await commands[method](...params);
            return { id, result };
        } catch (err) {
            return { id, error: { code: -32000, message: err.message } };
        }
    } else {
        return {
            id,
            error: {
                code: -32601,
                message: `Метод ${method} не реализован в контракте`,
            },
        };
    }
});
