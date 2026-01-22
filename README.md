# 🔢 MateAula - Matemáticas 1º Primaria

Módulo de matemáticas interactivas para primer curso de educación primaria. Puede usarse de forma independiente o integrado en el NexiaPortal.

---

## 🎯 Actividades Disponibles

### Operaciones Básicas
- **Sumas:** Operaciones con y sin llevadas, representación visual con bloques
- **Restas:** Iniciación a la resta con apoyo visual
- **Comparar:** Uso de símbolos <, =, > con el método del cocodrilo

### Numeración (0-99)
- **Lectura de Números:** Escritura de números en formato texto
- **Bloques Base 10:** Representación decimal con decenas y unidades
- **Anterior y Posterior:** Secuencias numéricas
- **Vecinos:** Casa de los números vecinos

### Representación y Lógica
- **Representa:** Asociar cantidad con número
- **Camino:** Recorrido numérico con saltos configurables
- **Batido:** Descomposición de números
- **Puzzle:** Completar series numéricas
- **Reloj:** Lectura de la hora (en punto y media)

### Herramientas
- **Pizarra Mágica:** Espacio de dibujo libre para cálculos

---

## 🎓 Currículo LOMLOE

Competencias trabajadas:
- **Numeración:** Lectura, escritura y orden de números hasta 99
- **Cálculo:** Estrategias de suma y resta
- **Representación:** Bloques base 10, recta numérica
- **Resolución de problemas:** Comprensión de enunciados y estrategias

---

## 🎮 Características

- ✅ 3 niveles de dificultad por actividad
- ✅ Sistema de puntuación y feedback visual
- ✅ Pizarra táctil para trazar números
- ✅ Apoyo visual con palillos (activable/desactivable)
- ✅ Configuración avanzada por actividad
- ✅ Responsive para tablets y pizarras digitales

---

## 📁 Estructura de Archivos

```
MateAula/
├── index.html              # Página principal
├── js/
│   └── app.js              # Lógica de la aplicación (1119 líneas)
├── css/
│   ├── styles.css          # Estilos principales
│   └── responsive.css      # Adaptación a pizarras digitales
└── README.md               # Este archivo
```

---

## 🚀 Uso

### Modo Standalone
Abrir directamente `index.html` en un navegador web.

### Integrado en Portal
El módulo se carga dentro de un iframe desde NexiaPortal y comunica resultados via `postMessage`.

---

## 🛠️ Desarrollo

### Añadir una Nueva Actividad

1. Añadir la tarjeta en el menú (HTML):
```html
<div class="menu-card" onclick="startActivity('nueva')">
    <span class="menu-title">Nueva Actividad</span>
</div>
```

2. Implementar la lógica en `js/app.js`:
```javascript
if (mode === 'nueva') {
    this.generateExerciseNueva();
}
```

3. Añadir al currículo LOMLOE si aplica

---

## 📄 Licencia

© 2026 Nexia Educación - Parte del proyecto CHUS
