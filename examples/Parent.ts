import {
  createContext,
  defineComponent,
  useSlot,
  useDomRef,
  useMount,
  useUnmount,
  useMediaQuery,
} from '../lib/main'
import type { ReadonlyRef } from '../lib/main'
import Child from './Child'

type Refs = {
  child: HTMLButtonElement
  or: HTMLElement | null
}

type ParentContextValue = {
  isOpen: ReadonlyRef<boolean>
  onOpen: () => void
  onClose: () => void
}

export const [provideParent, useParentContext] = createContext<ParentContextValue>()

export default defineComponent({
  name: 'parent',
  setup(_el) {
    const { refs } = useDomRef<Refs>('child', 'or')
    const { addChild } = useSlot()

    const [child] = addChild(refs.child, Child, {})

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
