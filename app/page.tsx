import { getContentOverrides } from '@/lib/content'
import MyVitalsPage from './MyVitalsPage'

export default async function Page() {
  const overrides = await getContentOverrides()
  return <MyVitalsPage overrides={overrides} />
}
