// Target of festflow://task/<id> links (widget rows, push notifications). Opens the task list.
import { Redirect } from 'expo-router';

export default function TaskDeepLink() {
  return <Redirect href="/(tabs)/tasks" />;
}
