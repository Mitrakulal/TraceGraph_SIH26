"""Service layer for Graph Explorer entity relationships."""

from collections import deque
from app.core.errors import APIException
from app.schemas.graph import (
    EdgeType,
    GraphEdge,
    GraphNode,
    GraphPayload,
    GraphSummary,
    NodeType,
)
from app.storage.artifact_store import store


class GraphService:
    """Business logic for entity graph traversal and windowing."""

    @staticmethod
    def get_entity_graph(
        entity_id: str,
        depth: int = 1,
        limit: int = 60,
    ) -> GraphPayload:
        """Perform BFS from focus entity up to specified depth and node limit."""

        if not store.is_loaded:
            store.load()

        if entity_id not in store.wallet_adjacency and entity_id not in store.wallet_risk_map:
            raise APIException(
                status_code=404,
                code="ENTITY_NOT_FOUND",
                message=f"No synthetic entity found with ID '{entity_id}'.",
            )

        # BFS initialization
        visited_nodes: set[str] = {entity_id}
        queue: deque[tuple[str, int]] = deque([(entity_id, 0)])
        nodes_dict: dict[str, GraphNode] = {}
        edges_dict: dict[str, GraphEdge] = {}
        truncated = False

        while queue:
            curr_id, curr_depth = queue.popleft()

            # Format readable node label
            if curr_id.startswith("syn_w_"):
                suffix = curr_id[-4:]
                label = f"Wallet {suffix}"
                ntype: NodeType = "WALLET"
            elif curr_id.startswith("syn_ip_"):
                suffix = curr_id[-4:]
                label = f"Synthetic IP {suffix}"
                ntype = "IP"
            else:
                label = curr_id
                ntype = "WALLET"

            risk_score = store.wallet_risk_map.get(curr_id)

            nodes_dict[curr_id] = GraphNode(
                id=curr_id,
                label=label,
                type=ntype,
                risk_score=risk_score,
                is_focus=(curr_id == entity_id),
            )

            # Traverse adjacent edges if depth limit not reached
            if curr_depth < depth:
                neighbors_edges = store.wallet_adjacency.get(curr_id, [])
                for edge in neighbors_edges:
                    nbr = edge["target"] if edge["source"] == curr_id else edge["source"]

                    if nbr not in visited_nodes:
                        if len(visited_nodes) >= limit:
                            truncated = True
                            continue
                        visited_nodes.add(nbr)
                        queue.append((nbr, curr_depth + 1))

                    # Edge creation
                    if nbr in visited_nodes:
                        edge_id = f"edge_{edge['event_id']}"
                        if edge_id not in edges_dict:
                            etype: EdgeType = "SENT_TO"
                            edges_dict[edge_id] = GraphEdge(
                                id=edge_id,
                                source=edge["source"],
                                target=edge["target"],
                                type=etype,
                                observed_at=edge["observed_at"],
                            )

        nodes_list = list(nodes_dict.values())
        edges_list = list(edges_dict.values())

        summary = GraphSummary(
            node_count=len(nodes_list),
            edge_count=len(edges_list),
            truncated=truncated,
        )

        return GraphPayload(
            focus_entity_id=entity_id,
            nodes=nodes_list,
            edges=edges_list,
            summary=summary,
            synthetic_notice="Synthetic relationship graph only. Human review required.",
        )
