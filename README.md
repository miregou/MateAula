# MateAula 🏫
**Pizarra Táctica Multiactividad para Educación Primaria**

Una aplicación web educativa diseñada para proyectarse en **pizarras digitales** o utilizarse en **tablets** y ordenadores para actividades de matemáticas en 1º y 2º de Primaria.

## ✨ Características
- **Sumas y Restas**: Generación infinita de operaciones.
- **Comparación**: Mayor qué, menor qué, igual.
- **Valor Posicional**: Manipulación visual de bloques (decenas y unidades).
- **Escritura**: Práctica de escritura de números y lectura.
- **Pizarra Mágica**: Lienzo integrado para resolver operaciones manualmente.
- **Offline First**: Funciona sin conexión a internet desde un USB (las funciones de IA se desactivan automáticamente).

## 🚀 Cómo usar (USB / Offline)
1. Descarga la carpeta completa `MateAula`.
2. Copia la carpeta a un USB.
3. Abre el archivo `index.html` en cualquier navegador web (Chrome, Edge, Safari, Firefox).
4. ¡Listo! No requiere instalación ni internet.

## 🛠️ Estructura del Proyecto
- `index.html`: Estructura principal.
- `css/styles.css`: Estilos visuales (sin dependencias externas).
- `js/app.js`: Lógica del juego y detección offline.

## 🤖 Funciones de IA (Opcional)
Si tienes conexión a internet y una API Key de Google Gemini, puedes habilitar:
- **Cuentacuentos**: Genera problemas matemáticos basados en la operación actual.
- **Lectura en voz alta**: El "Mago" lee las instrucciones.

Para activar esto, edita `js/app.js` y añade tu clave en la variable `apiKey`.

---
*Edición Mireia v8.0 - Optimizada para GitHub y Pizarra Digital*
