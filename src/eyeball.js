import * as core from '@theatre/core';
import {getProject, types as t} from "@theatre/core"
import studio from '@theatre/studio';
// import state from './state.json'

// Only initialise Studio in development mode
if (import.meta.env.MODE === 'development') {
  studio.initialize()
}
// To hide/show the UI pressing alt + \
studio.ui.hide()

// Creates the project and the scene (Sheet as it acts like a spreadheet)
const proj = core.getProject("G.O.D")
const sheet = proj.sheet("Scene")
const animation = sheet.sequence
animation.position = 0
animation.scaleY = 0
animation.scaleX = 0


// Add the elements to the scene

const eyeball = sheet.object("Eyeball", {
  position: t.compound({
    x: t.number(0, {
      range: [-60, 60],
      label: "Horizontal"
    }),
    y: t.number(0, {
      range: [-70, 70],
      label: "Vertical"
    })
  }),
  stretch: t.compound({
    x: t.number(0, {
      range: [0, 20],
      label: "ScaleX"
    }),
    y: t.number(0, {
      range: [0, 20],
      label: "ScaleY"
    })
  }),
  light: t.stringLiteral(
    "green", 
    {
      green: "Green",
      red: "Red",
      yellow: "Yellow",
    },
    {as: "switch"}
  ),
})

const eye = document.querySelector('.god__eye')
 
// setTimeout(() => {
//   document.appendChild(eye)
// })

eyeball.onValuesChange((newValues) => {
  eye.style.left = `${newValues.position.x}px`
  eye.style.top = `${newValues.position.y}px`
  eye.style.transform = `scaleX(${newValues.stretch.x}) scaleY(${newValues.stretch.y})`
})

eye.addEventListener("click", () => {
  animation.play(
  {
    range: [ 0, 9]
  })
})








