import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Button } from './Button.vue'

// Square, hairline buttons as in the v5 design: 3 px radius, 1 px border, cyan focus ring.
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-sm border text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground border-primary font-semibold hover:bg-primary/90',
        secondary: 'bg-secondary text-foreground border-border hover:bg-surface-3',
        outline: 'bg-secondary text-foreground border-border-strong font-semibold hover:bg-surface-3',
        destructive: 'bg-danger-soft text-destructive border-danger-border font-semibold hover:bg-destructive/20',
        ghost: 'bg-transparent border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground',
        link: 'h-auto rounded-none border-0 bg-transparent p-0 text-[11px] font-medium text-accent hover:text-accent/80',
        'link-muted':
          'h-auto rounded-none border-0 bg-transparent p-0 text-[11px] font-medium text-muted-foreground hover:text-foreground'
      },
      size: {
        xs: 'h-6 px-2 text-[11px]',
        sm: 'h-[30px] px-2.5',
        default: 'h-8 px-3',
        'icon-xs': 'size-6',
        'icon-sm': 'size-7'
      }
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'default'
    }
  }
)
export type ButtonVariants = VariantProps<typeof buttonVariants>
