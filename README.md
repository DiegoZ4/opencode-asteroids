# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye el power-up **Velocidad**, que duplica la velocidad de la nave durante cinco segundos, y de vez en cuando aparece una **estrella fugaz**: un asteroide especial mucho más rápido que el resto que se apaga solo a los pocos segundos; destruirla suelta un power-up Velocidad en su lugar.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción     |
| --------- | ---------- |
| `←` `→`   | Rotar nave |
| `↑`       | Propulsar  |
| `Espacio` | Disparar   |

En la pantalla de **Game Over**, `←` `→` cambian la nave (skin) y `Espacio` reinicia con la elegida. La selección se recuerda entre sesiones (`localStorage`).

## Puntuación

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |

La **estrella fugaz** no otorga puntos: destruirla suelta un power-up **Velocidad** donde estaba.

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-up **Velocidad**: aparece en el campo cada cierto tiempo; al recogerlo, la nave se mueve al doble de rapidez durante 5 s (se pierde al morir)
- **Estrella fugaz**: asteroide especial dorado que aparece en el campo cada cierto tiempo, se mueve mucho más rápido que el resto y se apaga sola a los pocos segundos (parpadea antes de desaparecer); como todo asteroide, mata la nave al contacto. Destruirla no da puntos, pero suelta un power-up **Velocidad** donde estaba
- **Skins de nave**: 4 naves con formas y colores propios (Clásica, Caza, Dardo y Platillo); se eligen en la pantalla de Game Over y la selección se recuerda entre sesiones. Los iconos de vidas reflejan la nave elegida
