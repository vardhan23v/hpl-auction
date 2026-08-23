import { PlayersTable } from "../players/PlayersTable";
export const dynamic = "force-dynamic";
export default function Unsold() { return <PlayersTable title="Unsold Players" fixedStatus="UNSOLD" />; }
