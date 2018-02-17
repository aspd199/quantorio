import Helpers from './Helpers'

let resources
let recipes
let machines
let categories
let beacons

let rowIdIncrement = 1
let recipeConfigs = {}
let bonus = {
  productivity: 0,
  speed: 0,
  consumption: 0,
  pollution: 0,
}
let difficulty = 'normal'

class Row {
  constructor (name, type, indent) {
    resources = window.meta.resources
    recipes = window.meta.recipes
    machines = window.meta.machines
    categories = window.meta.categories
    beacons = window.meta.beacons

    let isResource = Boolean(resources[name])
    indent || (indent = 0)
    this.id = rowIdIncrement++
    this.name = name
    this.machine = null
    this.recipe = isResource ? resources[name] : recipes[name]
    this.needs = 0
    this.modules = []
    this.beacons = []
    this.type = type
    this._sub = null
    this.canExpend = true
    this.expended = false
    this.isResource = isResource
    this.indent = indent
    this.bonus = Object.assign({}, bonus)
    this.batchTime = 0.5
    this.sources = []
    this.isData = true

    if (!this.recipe) {
      this.recipe = recipes.dummy
    }

    if (this.recipe.showName) {
      this.showName = this.recipe.showName
    }

    this.icon = Helpers.icon(this.showName || name)

    this.machine = machines.find(machine => machine.name === categories[this.recipe.category][0])

    beacons.forEach(beacon => {
      this.beacons.push({
        count: 0,
        modules: [],
        beacon: beacon
      })
    })

    if (recipeConfigs[name]) {
      recipeConfigs[name].forEach(config => {
        this[config.k] = config.v
      })
    }
  }

  get sub () {
    if (this._sub === null) {
      this.update()
    }
    return this._sub
  }

  // eslint-disable-next-line camelcase
  get result_count () {
    if (this.isResource) {
      return 1
    }
    return this.recipe[difficulty].results[Object.keys(this.recipe[difficulty].results)[0]] || 1
  }

  machineCount () {
    return this.needs / this.calcResultPerMachinePerMinute()
  }

  inserterCount (inserter) {
    return this.calcResultPerMachinePerMinute() / inserter.turns_per_minute
  }

  calcResultPerMachinePerMinute () {
    let recipe = this.recipe
    let machine = this.machine
    let count
    if (this.isResource) {
      count = 60 / (recipe.mining_time / machine.mining_speed / (machine.mining_power - recipe.hardness))
    } else {
      count = 60 / (recipe[difficulty].energy_required / machine.crafting_speed) * this.result_count
    }

    if (this.bonus.productivity) count *= (1 + this.bonus.productivity)
    if (this.bonus.speed) count *= (1 + this.bonus.speed)
    return count
  }

  update () {
    if (this._sub === null) {
      this._sub = []
    }

    this.bonus = Object.assign({}, bonus)

    Object.keys(this.bonus).forEach(name => {
      let moduleFilter = module => {
        if (module && module.effect[name]) {
          this.bonus[name] += module.effect[name].bonus
        }
      }

      this.modules.forEach(moduleFilter)

      this.beacons.forEach(beaconConfig => {
        beaconConfig.modules.forEach(module => {
          if (module && module.effect[name]) {
            this.bonus[name] += module.effect[name].bonus * beaconConfig.count * beaconConfig.beacon.distribution_effectivity
          }
        })
      })
    })

    if (this.isResource) {
      return
    }

    let recipe = this.recipe[difficulty]

    let ingredients = recipe.ingredients
    Object.keys(ingredients).forEach(ingredient => {
      let value = ingredients[ingredient]
      let subrow = this._sub.find(subrow => {
        return subrow.name === ingredient
      })
      if (!subrow) {
        subrow = new Row(ingredient, 'sub', this.indent + 1)
        this._sub.push(subrow)
      }
      subrow.needs = this.needs / this.result_count * value / (1 + this.bonus.productivity)

      if (typeof resources[ingredient] === 'undefined') {
        subrow.update()
      }
    })
  }

  saveRecipeConfig () {
    recipeConfigs[this.name] = [
      { k: 'machine', v: this.machine },
      { k: 'beacons', v: this.beacons },
      { k: 'modules', v: this.modules },
    ]
  }
}

export default {
  Row: Row,
  difficulty: difficulty
}
