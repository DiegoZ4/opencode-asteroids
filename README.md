# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye tres power-ups: **Velocidad**, que duplica la velocidad de la nave durante cinco segundos; **Triple disparo**, que hace que cada disparo lance tres balas desde el morro que se abren en abanico durante cinco segundos; y **Escudo**, que rodea la nave con una burbuja protectora durante seis segundos que destruye los asteroides al contacto (sin dar puntos). De vez en cuando aparece una **estrella fugaz**: un asteroide especial mucho más rápido que el resto que se apaga solo a los pocos segundos; destruirla suelta uno de los tres power-ups en su lugar.

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

La **estrella fugaz** no otorga puntos: destruirla suelta un power-up (**Velocidad**, **Triple disparo** o **Escudo**) donde estaba. Los asteroides destruidos por el **Escudo** tampoco otorgan puntos. Con la nave **River**, todos los puntos obtenidos se duplican (×2).

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-up **Velocidad**: aparece en el campo cada cierto tiempo; al recogerlo, la nave se mueve al doble de rapidez durante 5 s (se pierde al morir)
- Power-up **Triple disparo**: aparece en el campo cada cierto tiempo; al recogerlo, cada disparo lanza tres balas (en amarillo) que salen del morro y se abren en abanico durante 5 s (se pierde al morir)
- Power-up **Escudo**: aparece en el campo cada cierto tiempo; al recogerlo, una burbuja verde rodea la nave durante 6 s y destruye los asteroides que la toquen (se fragmentan como con un disparo, pero sin puntos; la estrella fugaz destruida por el escudo no suelta power-up). Se pierde al morir
- **Estrella fugaz**: asteroide especial dorado que aparece en el campo cada cierto tiempo, se mueve mucho más rápido que el resto y se apaga sola a los pocos segundos (parpadea antes de desaparecer); como todo asteroide, mata la nave al contacto. Destruirla no da puntos, pero suelta un power-up (**Velocidad**, **Triple disparo** o **Escudo**) donde estaba
- **Skins de nave**: 5 naves con formas y colores propios (Clásica, Caza, Dardo, Platillo y River); se eligen en la pantalla de Game Over y la selección se recuerda entre sesiones. Los iconos de vidas reflejan la nave elegida
- **Nave River**: luce la camiseta de River Plate (casco blanco con banda roja diagonal) y es el doble de grande que el resto (radio de colisión, morro de disparo, llama y burbuja de escudo también se duplican), pero a cambio el jugador recibe el **doble de puntos** (×2) con ella; el HUD lo indica con un aviso «PUNTOS ×2»
