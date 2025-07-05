"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
let prisma;
if (process.env.NODE_ENV === 'production') {
    prisma = new client_1.PrismaClient();
}
else {
    // Ensure the prisma instance is re-used during hot-reloading
    // in development to prevent too many connections.
    // @ts-ignore
    if (!global.prisma) {
        // @ts-ignore
        global.prisma = new client_1.PrismaClient({
        // Uncomment the line below to see Prisma logs in development
        // log: ['query', 'info', 'warn', 'error'],
        });
    }
    // @ts-ignore
    prisma = global.prisma;
}
exports.default = prisma;
//# sourceMappingURL=prisma.js.map