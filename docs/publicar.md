# Cómo subir el proyecto a GitHub y tener un enlace público

El proyecto ya está guardado como repositorio en esta computadora (carpeta
`~/NASA`). Falta subirlo a tu cuenta de GitHub. Hay dos caminos.

## Camino A (recomendado): con la herramienta `gh`

1. Instala la herramienta de GitHub (una sola vez):
   ```bash
   brew install gh
   ```
2. Inicia sesión. Te abre el navegador para que entres a tu cuenta:
   ```bash
   gh auth login
   ```
   Elige: GitHub.com → HTTPS → Yes → Login with a web browser.
3. Crea el repositorio público y sube todo:
   ```bash
   cd ~/NASA && gh repo create groundtruth-cibao --public --source=. --push
   ```
4. Activa la página pública (cambia TU_USUARIO por tu usuario de GitHub):
   ```bash
   gh api -X POST repos/TU_USUARIO/groundtruth-cibao/pages -f "source[branch]=main" -f "source[path]=/"
   ```
5. En uno o dos minutos la herramienta estará en:
   `https://TU_USUARIO.github.io/groundtruth-cibao/`

Si prefieres, después del paso 2 dile a la IA "ya inicié sesión en gh" y ella hace
los pasos 3 y 4.

## Camino B: con la aplicación GitHub Desktop

1. Descarga e instala GitHub Desktop (desktop.github.com) e inicia sesión.
2. Menú File → Add Local Repository → elige la carpeta `~/NASA`.
3. Botón "Publish repository". Desmarca "Keep this code private". Publica.
4. En github.com abre el repositorio → Settings → Pages → en "Branch" elige `main`
   y carpeta `/ (root)` → Save.
5. En uno o dos minutos aparece el enlace público en esa misma pantalla.

## Después de publicar

- Abre el enlace en un celular y en la computadora del pitch.
- Pon el enlace del repositorio y el de la página en el formulario de Space Apps.
- Cada vez que cambie algo: `git add -A && git commit -m "describe el cambio" && git push`
  (o el botón "Commit" y "Push" en GitHub Desktop).

## Antes de publicar, decidan en equipo

- **Autor de los guardados:** quedó como "GroundTruth Cibao" con un correo que no
  existe, para no hacer público el correo personal de nadie. Se puede cambiar.
- **Documentos internos:** `docs/vision_ojo_de_dios.md` y `docs/hoja_de_ruta_claude.md`
  se quedan solo en la computadora del equipo (están en `.gitignore`), porque tienen
  cifras sin fuente verificada.
- **Licencia:** el repositorio no tiene archivo de licencia. Si quieren que otros
  puedan reutilizar el código, agreguen una (por ejemplo MIT).
