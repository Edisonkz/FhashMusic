# Guía de Contribución — FhashMusic

¡Gracias por tu interés en contribuir a **FhashMusic**!

## Flujo de Ramas (Git Flow)

- `main`: rama estable de producción con tags semánticos (`v2.x.x`).
- `develop`: rama de integración continua para nuevas funcionalidades.
- `feature/<nombre>`: nuevas características creadas desde `develop`.
- `fix/<nombre>` / `hotfix/<nombre>`: corrección de errores.

## Convención de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat(scope): descripción breve`
- `fix(scope): descripción breve`
- `style(scope): cambios visuales o de CSS`
- `test(scope): pruebas unitarias o de integración`
- `docs(scope): documentación y README`

## Verificación antes de abrir un Pull Request

**Backend:**
```bash
cd backend
python -m unittest discover -s tests -v
```

**Frontend:**
```bash
cd frontend/FashMusic
npm run build
npx ng test --watch=false
```
