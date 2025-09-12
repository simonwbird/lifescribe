import ThisWeeksCaptures from './ThisWeeksCaptures'
import Suggestions from './Suggestions'
import Upcoming from './Upcoming'

export default function RightRail() {
  return (
    <div className="space-y-6">
      <ThisWeeksCaptures />
      <Suggestions />
      <Upcoming />
    </div>
  )
}