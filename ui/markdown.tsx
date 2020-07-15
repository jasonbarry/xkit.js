/// <reference path="../declarations.d.ts"/>

import * as React from 'react'
import * as ReactDOM from 'react-dom'
import unified, { Processor, Plugin } from 'unified'
import parse from 'remark-parse'
import remark2react, { components as RemarkComponents } from 'remark-react'
import { theme } from './theme'
import {
  Pane,
  Heading,
  Paragraph,
  Link,
  Strong,
  Code,
  OrderedList,
  UnorderedList,
  ListItem,
  ThemeProvider
} from 'evergreen-ui'

const mediumComponents: RemarkComponents = {
  code: Code,
  p: (props: React.PropsWithChildren<{}>) => <Paragraph marginTop="default" {...props} />,
  ul: UnorderedList,
  ol: OrderedList,
  li: ListItem,
  a: Link,
  strong: Strong,
  h1: (props: React.PropsWithChildren<{}>) => <Heading marginTop="default" size={800} {...props} />,
  h2: (props: React.PropsWithChildren<{}>) => <Heading marginTop="default" size={700} {...props} />,
  h3: (props: React.PropsWithChildren<{}>) => <Heading marginTop="default" size={600} {...props} />,
  h4: (props: React.PropsWithChildren<{}>) => <Heading marginTop="default" size={500} {...props} />,
  h5: (props: React.PropsWithChildren<{}>) => <Heading marginTop="default" size={400} {...props} />,
  h6: (props: React.PropsWithChildren<{}>) => <Heading marginTop="default" size={300} {...props} />
}

const largeComponents: RemarkComponents = Object.assign({}, mediumComponents, {
  code: (props: React.PropsWithChildren<{}>) => <Code size={500} {...props} />,
  p: (props: React.PropsWithChildren<{}>) => <Paragraph marginTop="default" size={500} {...props} />,
  ul: (props: React.PropsWithChildren<{}>) => <UnorderedList size={500} {...props} />,
  ol: (props: React.PropsWithChildren<{}>) => <OrderedList size={500} {...props} />,
  a: (props: React.PropsWithChildren<{}>) => <Link size={500} {...props} />,
  strong: (props: React.PropsWithChildren<{}>) => <Strong size={500} {...props} />,
  h1: (props: React.PropsWithChildren<{}>) => <Heading marginTop="default" size={900} {...props} />,
  h2: (props: React.PropsWithChildren<{}>) => <Heading marginTop="default" size={800} {...props} />,
  h3: (props: React.PropsWithChildren<{}>) => <Heading marginTop="default" size={700} {...props} />,
  h4: (props: React.PropsWithChildren<{}>) => <Heading marginTop="default" size={600} {...props} />,
  h5: (props: React.PropsWithChildren<{}>) => <Heading marginTop="default" size={500} {...props} />,
  h6: (props: React.PropsWithChildren<{}>) => <Heading marginTop="default" size={400} {...props} />
})

const smallComponents: RemarkComponents = Object.assign({}, mediumComponents, {
  code: (props: React.PropsWithChildren<{}>) => <Code size={300} {...props} />,
  p: (props: React.PropsWithChildren<{}>) => <Paragraph marginTop="default" size={300} {...props} />,
  ul: (props: React.PropsWithChildren<{}>) => <UnorderedList size={300} {...props} />,
  ol: (props: React.PropsWithChildren<{}>) => <OrderedList size={300} {...props} />,
  a: (props: React.PropsWithChildren<{}>) => <Link size={300} {...props} />,
  strong: (props: React.PropsWithChildren<{}>) => <Strong size={300} {...props} />,
  h1: (props: React.PropsWithChildren<{}>) => <Heading marginTop="default" size={600} {...props} />,
  h2: (props: React.PropsWithChildren<{}>) => <Heading marginTop="default" size={500} {...props} />,
  h3: (props: React.PropsWithChildren<{}>) => <Heading marginTop="default" size={400} {...props} />,
  h4: (props: React.PropsWithChildren<{}>) => <Heading marginTop="default" size={300} {...props} />,
  h5: (props: React.PropsWithChildren<{}>) => <Heading marginTop="default" size={200} {...props} />,
  h6: (props: React.PropsWithChildren<{}>) => <Heading marginTop="default" size={100} {...props} />
})

enum Sizes {
  small = 'small',
  medium = 'medium',
  large = 'large'
}

type Processors = Record<Sizes, Processor>

const ParentProcessor = unified().use(parse)

const PROCESSORS: Processors = {
  [Sizes.small]: ParentProcessor().use(remark2react, { remarkReactComponents: smallComponents}),
  [Sizes.medium]: ParentProcessor().use(remark2react, { remarkReactComponents: mediumComponents}),
  [Sizes.large]: ParentProcessor().use(remark2react, { remarkReactComponents: largeComponents})
}

// Credit: https://github.com/fernandopasik/react-children-utilities/blob/master/src/lib/onlyText.ts
function childToString(child?: React.ReactElement | boolean | {} | null): string {
  if (child == null) {
    return ''
  }

  if (!(child instanceof Array) && !React.isValidElement(child)) {
    if (typeof child === 'object' || typeof child === 'boolean') {
      return ''
    }
  }

  return (child as string | number).toString()
}

function childrenToText(children?: React.ReactNode): string {
  if (!(children instanceof Array) && !React.isValidElement(children)) {
    return childToString(children)
  }

  const stringChildren = React.Children.map(children, (child) => {
    if (React.isValidElement<React.PropsWithChildren<{}>>(child)) {
      return childrenToText(child.props.children)
    }
    return childToString(child)
  })

  // We are rendering markdown, so we need to preserve line breaks,
  // which we approximate here with separate react children.
  return stringChildren.join('\n')
}

interface MarkdownProps {
  text?: string,
  size?: keyof typeof Sizes | typeof Sizes
}

export default class Markdown extends React.Component<MarkdownProps> {
  static defaultProps = {
    size: Sizes.medium
  }

  constructor (props: React.PropsWithChildren<MarkdownProps>) {
    super(props)
    if (this.props.text && this.props.children) {
      console.warn(
`The <Markdown> component accepts a \`text\` property, or \`children\` with text content to render.
You have provided both. The \`children\` will be ignored and only the \`text\` will render.`
      )
    }
  }

  render(): React.ReactElement {
    const { text, children, size } = this.props
    const markdownSrc = text ? text : childrenToText(children)
    const processor = PROCESSORS[size]

    return (
      <Pane>
        {processor.processSync(markdownSrc).result}
      </Pane>
    )
  }
}
