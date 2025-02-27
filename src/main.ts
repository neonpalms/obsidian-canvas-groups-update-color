import { Plugin, ItemView } from "obsidian";
import { CanvasData, CanvasNodeData, CanvasGroupData } from "../types/canvas";
import CanvasEvent from "../events/canvas_event";
import CanvasEventPatcher from "../events/canvas_event_patcher";

export default class CanvasGroupsUpdateColorPlugin extends Plugin {
	async onload(): Promise<void> {
		CanvasEventPatcher.init(this);

		console.log(
			"%cCanvas 'group nodes update color' plugin loaded.",
			"color:#4000FF;",
		);

		this.registerEvent(
			this.app.workspace.on(
				// @ts-ignore
				CanvasEvent.CanvasSaved.Before,
				// @ts-ignore
				(...args: any[]) => {
					this.updateColorOfAllGroupedNodes();
					this.saveCanvas();
				},
			),
		);
	}

	async updateColorOfAllGroupedNodes(): Promise<void> {
		const canvasView = this.app.workspace.getActiveViewOfType(ItemView);
		// @ts-ignore
		const canvas: CanvasData = canvasView?.canvas;

		const nodesObj = await this.findAllGroupNodes(canvas);
		nodesObj.groupNodes.forEach(async (groupNode) => {
			const groupColor = groupNode.color;
			const groupedNodes = await this.getAllNodesFromGroup(
				canvas,
				groupNode,
				nodesObj.otherNodes,
			);
			groupedNodes.forEach((groupedNode) => {
				groupedNode.color = groupColor;
			});
		});
	}

	async findAllGroupNodes(canvas: CanvasData): Promise<{
		groupNodes: CanvasGroupData[];
		otherNodes: CanvasNodeData[];
	}> {
		const groups: CanvasGroupData[] = [];
		const others: CanvasNodeData[] = [];
		canvas.nodes.forEach(async (node) => {
			if (await this.isGroupNode(node)) {
				// @ts-ignore
				groups.push(node);
			} else {
				// @ts-ignore
				others.push(node);
			}
		});
		const allGroupNodes = { groupNodes: groups, otherNodes: others };
		return allGroupNodes;
	}

	async isGroupNode(node: CanvasNodeData): Promise<boolean> {
		// Found this was easier than what I was doing; checking the 'type' attribute
		// Nodes don't have a type when they're created.
		const nodeClassName: string = node.nodeEl.className;
		const isIt: boolean = nodeClassName.includes("canvas-node-group");
		return isIt;
	}

	// Looks for intersections with the group node & all other nodes on the canvas
	async getAllNodesFromGroup(
		canvas: CanvasData,
		groupNode: CanvasGroupData,
		nodes: CanvasNodeData[],
	): Promise<CanvasNodeData[]> {
		const groupedNodes = canvas
			.getContainingNodes(groupNode.getBBox())
			.filter((node: CanvasNodeData) => node !== groupNode);

		return groupedNodes;
	}

	async saveCanvas(): Promise<void> {
		const canvasView: ItemView | null =
			this.app.workspace.getActiveViewOfType(ItemView);
		// @ts-ignore
		const canvas: CanvasData = canvasView?.canvas;
		canvas.rerenderViewport();
	}

	async onunload(): Promise<void> {
		console.log(
			"%cCanvas 'group nodes update color' plugin unloaded.",
			"color:#4000FF;",
		);
	}
}
