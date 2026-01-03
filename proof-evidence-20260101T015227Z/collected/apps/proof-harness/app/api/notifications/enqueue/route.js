"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const notifications_engine_core_1 = require("@qbos/notifications-engine-core");
const notificationsEngine = new notifications_engine_core_1.NotificationsEngine();
async function POST(request) {
    try {
        const body = await request.json();
        const { type, to, payload } = body;
        if (!type || !to) {
            return server_1.NextResponse.json({
                ok: false,
                error: 'type and to required',
            }, { status: 400 });
        }
        await notificationsEngine.enqueue({ type, to, payload });
        const queueSize = await notificationsEngine.getQueueSize();
        return server_1.NextResponse.json({
            ok: true,
            data: { queueSize },
            message: 'Notification enqueued via NotificationsEngine',
        });
    }
    catch (error) {
        return server_1.NextResponse.json({
            ok: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map