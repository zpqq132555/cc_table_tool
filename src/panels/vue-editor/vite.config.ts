import vue2 from '@vitejs/plugin-vue2';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
    const isCocos = mode === 'cocos';
    
    return {
        plugins: [vue2()],
        
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src'),
            },
        },
        
        base: isCocos ? './' : '/',
        
        build: {
            outDir: isCocos ? '../../../dist/vue-editor' : 'dist',
            emptyOutDir: true,
            rollupOptions: {
                output: {
                    // Cocos 模式下打包成单文件
                    ...(isCocos && {
                        entryFileNames: 'index.js',
                        chunkFileNames: '[name].js',
                        assetFileNames: '[name].[ext]',
                    }),
                },
            },
        },
        
        server: {
            port: 5173,
            open: true,
        },
    };
});
