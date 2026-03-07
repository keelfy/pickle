import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import LoadingSpinner from '@/components/ui/loading-spinner'
import {
  isUiNodeInputAttributes,
  UiNode,
  UiNodeInputAttributes,
} from '@ory/client-fetch'

export function mapOryUiNodesToShadcnForm(
  node: UiNode,
  key: number,
  isLoading: boolean = false,
  submitText?: string,
) {
  if (isUiNodeInputAttributes(node.attributes)) {
    const attrs = node.attributes as UiNodeInputAttributes
    const nodeType = attrs.type

    switch (nodeType) {
      case 'button':
      case 'submit':
        return (
          <Button
            key={key}
            type={attrs.type as 'submit' | 'button' | 'reset' | undefined}
            name={attrs.name}
            value={attrs.value}
            disabled={isLoading || attrs.disabled}
          >
            {isLoading && <LoadingSpinner />}
            {submitText || attrs.value}
          </Button>
        )
      default:
        return (
          <Input
            name={attrs.name}
            type={attrs.type}
            autoComplete={
              attrs.autocomplete || attrs.name === 'identifier'
                ? 'username'
                : ''
            }
            defaultValue={attrs.value}
            required={attrs.required}
            disabled={attrs.disabled}
            placeholder={attrs.value}
          />
        )
    }
  }
}
