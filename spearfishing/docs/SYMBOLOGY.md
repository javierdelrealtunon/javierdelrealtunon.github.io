# Simbología de los visores

Revisión y mejora del 7/11/2026. Alcance: mapa principal, visor de elementos de la ficha y editor de geometría. Objetivo: reconocer el tipo de elemento y su estado con poca carga visual, sin depender exclusivamente del color. Se conserva la estructura de la aplicación y sus datos.

## Auditoría de las tres superficies

1. **Mapa principal — mejorado.** La captura `01-map-before.png` mostraba previsiones y aparcamientos en verdes muy próximos y una leyenda de puntos de color sin símbolo. Los polígonos azules se mezclaban con la representación de la costa. `01-map-after.png` utiliza iconos tipados, previsiones violetas, aparcamientos azules, accesos naranja oscuro y zonas verde petróleo con relleno tenue. La costa de referencia pasa a gris discontinuo. Los fondos blancos de los símbolos los separan de la cartografía. Se mantiene la información al pasar el cursor.
2. **Ficha — mejorada.** `02-zone-before.png` mostraba círculos para todos los tipos y selecciones superpuestas a pequeña escala. `02-zone-after.png` reutiliza la misma simbología y añade una leyenda. La asignación se reconoce por fondo oscuro y marca de verificación. Los grupos se calculan por proximidad en pantalla y se separan al acercar. Un contador indica agrupación; una fracción como 2/3 indica asignación parcial. Los grupos mixtos utilizan el icono neutro de capas, sin atribuirles el color del primer elemento. La referencia meteorológica se identifica, pero no ofrece casilla de asignación.
3. **Editor — mejorado.** `03-editor-before.png` mostraba un contorno amarillo con tiradores circulares grandes que competían con los puntos del mapa. `03-editor-after.png` reserva el magenta y el trazo discontinuo para la geometría en edición, con tiradores cuadrados pequeños y un área de interacción de 24 px. El marcador móvil utiliza el icono de movimiento. El contexto pierde intensidad y el diálogo indica explícitamente que se está editando. Se conservan arrastre, deshacer y cancelación.

Las capturas anteriores y posteriores se conservan en la carpeta de verificación de la sesión, bajo `symbology/`. La comparación usa el mismo ámbito de Mundaka y una vista de escritorio de 1366 × 900. Los datos meteorológicos pueden cambiar entre capturas porque se consultan fuentes reales.

## Lenguaje compartido

| Categoría | Color | Símbolo y soporte |
|---|---|---|
| Pesca | `#0D766E` | Pez; contorno de zona continuo y relleno tenue |
| Aparcamiento | `#245FAD` | P en recuadro |
| Acceso | `#A9491B` | Flecha de entrada y base |
| Fotografía | `#596575` | Cámara en placa redondeada |
| Previsión | `#7150B5` | Nube y sol en rombo |
| Grupo mixto | `#354F69` | Capas y contador |
| Edición | `#AD3265` | Movimiento, tiradores y contorno discontinuo |

La clase de dato utiliza color, pictograma y forma. El estado de asignación utiliza marca y contraste de superficie; no cambia el significado de la categoría. Las fotografías asociadas a otro tipo usan una pequeña insignia de cámara. La ubicación de previsión activa se resalta dentro de su propia categoría. Los vectores de oleaje, viento y corriente conservan sus convenciones de dirección y sus rótulos, con flechas de la misma biblioteca y colores diferenciados.

Los colores identifican categorías, no niveles de seguridad ni condiciones favorables. Los símbolos se anclan por su centro para compartir la misma referencia espacial. En móvil, el botón **Capas** se separa del zoom, el panel se sitúa por encima de los controles y ofrece un cierre explícito. Se corrigió el solapamiento previo que impedía abrir la leyenda con un clic normal. El listado cercano utiliza una columna en teléfonos estrechos para que los nombres no queden fragmentados.

La configuración vive en `marine/map-symbols.js` y su presentación en `marine/symbology.css`. Los iconos de Lucide están incluidos localmente, con commit fijado y licencia en `assets/lucide/`, sin dependencias de un CDN en tiempo de uso. Los elementos, geometrías y relaciones de la base no se modifican por estos cambios visuales.

## Accesibilidad y límites de la comprobación

El criterio de diseño sigue las recomendaciones del W3C de [no transmitir información solo con color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) y cuidar el [contraste no textual](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html). Los colores base de los pictogramas superan 4,5:1 frente al blanco en los cálculos automatizados; el blanco de los símbolos asignados supera 10:1 frente a su fondo oscuro. Se añaden foco visible, nombres y leyendas textuales.

Estas comprobaciones no certifican conformidad WCAG de toda la aplicación. No se han realizado pruebas con lectores de pantalla ni con usuarios con deficiencia de visión cromática. No se mide cada combinación posible del mapa base: la superficie opaca y el borde de los símbolos reducen su dependencia de ese fondo. A escalas muy alejadas, en el mapa principal todavía puede ser necesario acercarse para distinguir puntos de una misma categoría; la agrupación dinámica se aplica al visor pequeño de la ficha.

## Verificación funcional y visual

71 pruebas automatizadas correctas: distinción de categorías, contraste de los tokens base, indicadores de asignación completa/parcial, agrupación a escala sin modificar los datos, presencia de los recursos locales y regresiones existentes de datos, geometría y previsiones. Se ha verificado la respuesta `image/svg+xml` del servidor local y se incluyen los iconos en el empaquetado y la caché de la aplicación.

En navegador se comprobó la leyenda móvil, el apagado y encendido de las previsiones (0 al desactivar y recuperación del listado completo al activar), los nombres y los grupos con teclado, la separación al acercar (6→12 símbolos en la vista comprobada), la asignación parcial 2/3 y su cancelación restaurando las tres selecciones, y la referencia de previsión sin casilla de asignación. Se inspeccionaron los símbolos y los tres vectores sobre el mapa base y sobre satélite. Las pruebas interactivas no escriben cambios ficticios en la base compartida.
