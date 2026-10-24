---
description: Crea un worktree en .worktrees/ con nombre derivado del argumento o del contexto
---

Crea un worktree de git ejecutando un único comando. No hagas nada más.

## Nombre del worktree

- Argumento recibido (puede estar vacío o contener espacios): $ARGUMENTS
- Si hay argumento, deriva de él un nombre corto y descriptivo.
- Si está vacío, deriva el nombre del contexto actual de la conversación.
- Normaliza siempre a kebab-case: minúsculas, sin acentos ni caracteres
  especiales, palabras separadas por guiones.
- Si el folder .worktrees ya existe usarlo no crear otra adentro

## Única acción

Ejecuta exactamente este comando (sustituyendo <nombre>):

git worktree add .worktrees/<nombre>

No hagas nada adicional: no cambies de directorio, no cambies de rama,
no hagas commit, no modifiques archivos, no ejecutes verificaciones.
