<template>
  <el-popover
    placement="bottom"
    trigger="hover"
    v-model="visiable"
    >
    <span>
      <img v-for='_module in allowedModules' class='icon icon-bordered button' :src='icon(_module, "module")' @click="update(_module)">
    </span>
    <slot slot='reference'></slot>
  </el-popover>
</template>
<script>
import Helpers from './Helpers'
export default {
  props: ['allows', 'module', 'recipe'],
  data () {
    return {
      allowedModules: [],
      selectedModule: null,
      visiable: false,
    }
  },
  methods: {
    icon: Helpers.icon,
    update (_module) {
      this.selectedModule = _module
      this.visiable = false
      this.$emit('update:module', _module)
      this.$emit('change')
    }
  },
  mounted () {
    this.selectedModule = this.module
    this.modules.forEach(module => {
      let allowed = true
      if (module) {
        if (this.allows) {
          Object.keys(module.effect).forEach(effect => {
            if (!this.allows.includes(effect)) {
              allowed = false
            }
          })
        }
        if (this.recipe && module.limitation && module.limitation.indexOf(this.recipe.name) === -1) {
          allowed = false
        }
        if (allowed) {
          this.allowedModules.push(module)
        }
      }
    })
    this.allowedModules.unshift(null)
  },

  computed: {
    modules () {
      return this.$store.state.meta.modules
    }
  },
}
</script>