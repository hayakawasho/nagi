import {
  createContext,
  defineComponent,
  useSlot,
  useDomRef,
  useMount,
  useUnmount,
  useMediaQuery,
  withContext,
  ref,
  readonly,
} from '../lib/main'
import type { ReadonlyRef } from '../lib/main'
import Child from './Child'

type Refs = {
  child: HTMLButtonElement
  or: HTMLElement | null
}

const [ParentProvider, useParentContext] = createContext<{
  isOpen: ReadonlyRef<boolean>
  onOpen: () => void
  onClose: () => void
}>()

export { useParentContext }

export default defineComponent({
  name: 'parent',
  setup(_el) {
    const { refs } = useDomRef<Refs>()
    const { addChild } = useSlot()

    const isOpen = ref(false)

    const [child] = addChild(refs.child, withContext(ParentProvider, {
      isOpen: readonly(isOpen),
      onOpen: () => {
        isOpen.value = true;
      },
      onClose: () => {
        isOpen.value = false;
      },
    })(Child), {})

    child.current.test()

    useMount(() => {
      console.log('parent:mount')
    })

    useUnmount(() => {
      console.log('parent:unmount')
    })

    useMediaQuery('(min-width:640px)', () => {
      console.log('mq:mount')

      return () => {
        console.log('mq:cleanup')
      }
    })
  },
})