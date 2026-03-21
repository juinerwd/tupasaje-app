# Autenticación y Registro: Mejoras de Interfaz de Usuario y Experiencia (UI/UX)

Este documento detalla todas las implementaciones de diseño moderno, correcciones de errores críticos y flujos de experiencia de usuario que se introdujeron en la aplicación móvil `tupasaje-app`.

## 1. Rediseño del Inicio de Sesión (Login)
- **Flujo de Dos Pasos:** La pantalla se dividió en dos pasos limpios: primero el número de teléfono y segundo el código PIN.
- **Teclado Personalizado:** Para el ingreso del PIN, eliminamos el teclado nativo y lo sustituimos por un teclado personalizado (`NumericKeypad`) con botones redondeados y un panel indicador (`PinDisplay`), priorizando el aspecto premium.
- **Ajuste y Resolución del Teclado (Step 1):** 
  - Se migró de una lógica que desplazaba los píxeles (translates numéricos) a una solución usando flexbox puro (`justifyContent: flex-start`). Ahora, si el usuario abría el teclado, la estructura se auto-alineará mágicamente en la parte superior. Esto eliminó el error de "botón oculto" para siempre en todas las resoluciones.
  - El enlace "¿Ya tienes una cuenta?" desaparece de forma reactiva al escribir para optimizar el espacio visual.
- **Filtro Estricto (`keyboardType="numeric"`):** Evitamos rotúndamente la entrada de letras o símbolos pegando código o mediante portapapeles.
- **Corrección de Bucle Infinito (Throttling / Rate Limit):** Se eliminó un `useEffect` defectuoso que reenviaba de forma desenfrenada la petición de validación cada que el usuario dejaba escrita una clave incorrecta. En su lugar, instalamos una validación unitaria sincronizada a la pulsación exacta del sexto dígito y la pantalla purga el código erróneo automáticamente limpiando la fila.

## 2. Rediseño del Módulo de Registro (Register)
Se basó gran parte del diseño visual en las sugerencias predefinidas de la maqueta de origen de Stitch.

### Header y Componente Principal
- Se eliminó la `ProgressBar` horizontal básica clásica de `<View/>` a favor de un indicador mucho más elegante de paso literal: **"● PASO 1 DE 5"**.
- Título minimalista posicionado en el Header y fondos estéticos sin bordes superpuestos para una apariencia pulida continua ("Seamless").

### Paso 1: Selección de Rol (`step1-user-type.tsx`)
- Se implementaron tarjetas gigantes (Large Cards) con iconos sobre fondos coloreados pastel para "Soy Pasajero" y "Soy Conductor".
- El texto es completamente descriptivo basado en Stitch y ofrece mucha más amabilidad y confianza al usuario inicial ("Moviendo tu ciudad con confianza").
- **Flujo Directo (Zero-click continuation):** Se descartó la tediosa tarea de elegir una burbuja y luego presionar un botón lejano "Continuar". Al tocar la tarjeta directamente, el registro navega inmediatamente al siguiente paso.
- Añadimos la caja gris "Píldora de información" de seguridad con el icono de escudo.

### Paso 2: Verificación de Teléfono (`step2-phone-verification.tsx`)
- Títulos extra-grandes y centrados en negrita (Size 28).
- **Entrada Numérica Nativa e Ilusión Óptica:** Descartamos el teclado interno personalizado y lo reemplazamos por el teclado nativo original superpuesto transparentemente (`opacity: 0`). Con esta técnica de UI, los usuarios observan el diseño premium moderno de matriz de puntos pero interactúan a la perfección con la seguridad del teclado numérico Android/iOS.
- **Animación de Autodesplazamiento Suave (Auto ScrollTo Viewport):** En lugar del truco de ocultamiento, construimos una referencia a la capa principal `ScrollView`. Conectada inteligentemente a los listeners (`KeyboardDidShow`/`DidHide`), toda la estructura ahora tiene peso propio y efectúa de forma orquestada un *Slide Up* (Deslizamiento natural ascendente) cuando detecta un encuadre físico de teclado. Todos los campos permanecen intactos como una hoja real que sube sin tapar un botón.
