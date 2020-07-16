import * as React from 'react'
import * as ReactDOM from 'react-dom'
import ConnectorDetail from './connector-detail'
import { IKitConfig } from '../lib/config'
import { Connector } from '../lib/api/connector'
import {
  Connection,
  isConnection,
  getConnectionOrConnector
} from '../lib/api/connection'
import { hasOwnProperty } from '../lib/util'
import { toaster } from './toaster'
import {
  Pane,
  Spinner
} from 'evergreen-ui'
import {
  withConfig,
  ConfigConsumer,
  callWithConfig
} from './config-wrapper'
import { Redirect } from 'react-router-dom'

interface ConnectorDetailRouteProps {
  slug: string,
  url: string
}

interface ConnectorDetailRouteState {
  connector?: Connector,
  connection?: Connection,
  loading: boolean
}

class ConnectorDetailRoute extends React.Component<ConfigConsumer<ConnectorDetailRouteProps>, ConnectorDetailRouteState> {
  constructor (props: ConfigConsumer<ConnectorDetailRouteProps>) {
    super(props)
    this.state = {
      loading: true
    }
  }

  componentDidMount () {
    this.loadConnector()
  }

  async loadConnector (): Promise<void> {
    const { slug } = this.props
    this.setState({ loading: true })
    try {
      const connection = await callWithConfig(config => getConnectionOrConnector(config, slug))
      if (isConnection(connection)) {
        this.setState({ connection: connection })
      }
      this.setState({ connector: connection.connector })
    } catch (e) {
      toaster.danger(`Error while loading connector: ${e.message}`)
    } finally {
      this.setState({ loading: false })
    }
  }

  render (): React.ReactElement {
    const {
      loading,
      connector,
      connection
    } = this.state
    if (loading) {
      return (
        <Pane display="flex" alignItems="center" justifyContent="center" height={150}>
          <Spinner />
        </Pane>
      )
    }

    if (!connector) {
      const { url, slug } = this.props
      const parentUrl = url.slice(0, -1 * slug.length)
      return <Redirect to={parentUrl} />
    }
    
    return (
      <ConnectorDetail
        connection={connection}
        connector={connector}
      />
    )
  }
}

export default withConfig(ConnectorDetailRoute)
