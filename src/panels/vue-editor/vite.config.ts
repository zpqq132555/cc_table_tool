import vue2 from '@vitejs/plugin-vue2';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
    const isCocos = mode === 'cocos';
    
    // 从命令行参数获取输出目录
    const customOutDir = process.env.npm_config_outDir || process.argv.find(arg => arg.startsWith('--outDir='))?.split('=')[1];
    const defaultOutDir = isCocos ? '../../../dist/vue-editor' : 'dist';
    const outDir = customOutDir || defaultOutDir;
    
    return {
        plugins: [vue2()],
        
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src'),
            },
        },
        
        base: isCocos ? './' : '/',
        
        build: {
            outDir: outDir,
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
