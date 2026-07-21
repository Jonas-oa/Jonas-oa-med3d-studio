# Med3D Studio

Editor 3D web para criação, segmentação e preparação de pacientes, vestuário hospitalar e objetos destinados a simulações médicas.

## Estado atual — MVP 0.1

- visualizador 3D responsivo com React Three Fiber;
- paciente demonstrativo segmentado em partes selecionáveis;
- importação local de arquivos GLB;
- detecção das malhas do modelo importado;
- lista de partes com mostrar, ocultar e isolar;
- edição de nome, cor, rugosidade, metalicidade e opacidade;
- visualização sólida ou wireframe;
- exportação do modelo visível em GLB;
- layout otimizado para computador, tablet e celular;
- publicação automática no GitHub Pages.

## Executar localmente

Requer Node.js 22 ou versão compatível com Vite 8.

```bash
npm install
npm run dev
```

Auditoria de compilação:

```bash
npm run typecheck
npm run build
```

## Próximas etapas

1. histórico real com desfazer e refazer;
2. segmentação com pincel e laço;
3. integração de geração imagem/texto para 3D por API;
4. correção de malha e retopologia;
5. texturas PBR e pintura direta;
6. rigging, poses e posicionamentos radiológicos;
7. biblioteca de pacientes, roupas, equipamentos e acessórios;
8. integração direta com o simulador de tomografia.

## Formato principal

O formato de trabalho e exportação inicial é GLB/glTF 2.0, adequado para aplicações web baseadas em Three.js.
