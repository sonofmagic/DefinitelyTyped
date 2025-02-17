let viewer: Autodesk.Viewing.GuiViewer3D;
const options = {
    env: 'AutodeskProduction',
    api: 'derivativeV2',  // for models uploaded to EMEA change this option to 'derivativeV2_EU'
    accessToken: ''
};

Autodesk.Viewing.Initializer(options, async () => {
    const htmlDiv = document.getElementById('forgeViewer');
    if (!htmlDiv)
        return;

    viewer = new Autodesk.Viewing.GuiViewer3D(htmlDiv);
    const startedCode = viewer.start();
    if (startedCode > 0) {
        console.error('Failed to create a Viewer: WebGL not supported.');
        return;
    }

    const documentId = 'urn:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6bXktYnVja2V0L215LWF3ZXNvbWUtZm9yZ2UtZmlsZS5ydnQ';
    const doc = await loadDocument(documentId);

    await doc.downloadAecModelData();
    const aecModelData = await Autodesk.Viewing.Document.getAecModelData(doc.getRoot());
    const defaultViewable = doc.getRoot().getDefaultGeometry();
    const model = await viewer.loadDocumentNode(doc, defaultViewable);

    globalTests();
    bubbleNodeTests(model);
    bufferReaderTest(model);
    callbackTests(viewer);
    cameraTests(viewer);
    formattingTests();
    fragListTests(model);
    instanceTreeTests(model);
    modelTests(model);
    modelStructurePanelTests(viewer);
    preferencesTests(viewer);
    showHideTests(viewer);
    await bulkPropertiesTests(model);
    await compGeomTests(viewer);
    await dataVizTests(viewer);
    await dataVizPlanarTests(viewer);
    await edit2DTests(viewer);
    await measureTests(viewer);
    await pixelCompareTests(viewer);
    await propertyTests(viewer);
    await propertyDbTests(model);
    await searchTests(viewer);
    await streamLineTests(viewer);
    await stringExtractorTests(viewer);
    await visualClustersTests(viewer);
});

function globalTests(): void {
    const urn = 'urn:adsk.wipdm:fs.file:vf.vSenZnaYQAOAZqzHB54kLQ?version=1';
    const urnBase64 = Autodesk.Viewing.toUrlSafeBase64(urn);

    // $ExpectType string
    const urn2 = Autodesk.Viewing.fromUrlSafeBase64(urnBase64);
}

function bubbleNodeTests(model: Autodesk.Viewing.Model): void {
    // $ExpectType string
    const lineageUrn = Autodesk.Viewing.BubbleNode.parseLineageUrnFromEncodedUrn('dXJuOmFkc2sud2lwc3RnOmZzLmZpbGU6dmYuM3Q4QlBZQXJSSkNpZkFZUnhOSnM0QT92ZXJzaW9uPTI');
    const node: Autodesk.Viewing.BubbleNode = model.getDocumentNode();

    // $ExpectType string
    node.getModelName();
    // $ExpectType string
    node.getInputFileType();
}

function bufferReaderTest(model: Autodesk.Viewing.Model): void {
    const instanceTree = model.getInstanceTree();
    const dbIds: number[] = [];

    instanceTree.enumNodeChildren(instanceTree.getRootId(), (dbId) => {
        if (instanceTree.getChildCount(dbId) === 0) {
            dbIds.push(dbId);
        }
    });
    const frags = model.getFragmentList();
    const objFrags = frags.fragments.dbId2fragId;

    for (const dbId of dbIds) {
        for (const fragId of objFrags) {
            const vbr = new Autodesk.Viewing.Private.VertexBufferReader(fragId);
            const bc = new Autodesk.Viewing.Private.BoundsCallback(new THREE.Box3());

            vbr.enumGeomsForObject(dbId, bc);
        }
    }
}

function callbackTests(viewer: Autodesk.Viewing.GuiViewer3D): void {
    const id = 2120;
    const fragId = viewer.model.getData().fragments.dbId2fragId[id];
    const mesh = viewer.model.getFragmentList().getVizmesh(fragId);

    if (mesh && mesh.geometry) {
        const vbr = new Autodesk.Viewing.Private.VertexBufferReader(mesh.geometry);
        const bounds = new THREE.Box3();
        const boundsCallback = new Autodesk.Viewing.Private.BoundsCallback(bounds);

        vbr.enumGeomsForObject(id, boundsCallback);
    }
}

function cameraTests(viewer: Autodesk.Viewing.GuiViewer3D): void {
    const up = new THREE.Vector3(0, 0, 1);

    viewer.navigation.setCameraUpVector(up);
}

async function bulkPropertiesTests(model: Autodesk.Viewing.Model): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const instanceTree = model.getInstanceTree();
        const ids: number[] = [];

        instanceTree.enumNodeChildren(instanceTree.getRootId(), (dbId) => {
            if (instanceTree.getChildCount(dbId) === 0) {
                ids.push(dbId);
            }
        });

        model.getBulkProperties(ids, {
            propFilter: [ "Name"] },
            (propResults) => {
                resolve();
            }
        );
    });
}

async function compGeomTests(viewer: Autodesk.Viewing.GuiViewer3D): Promise<void> {
    await viewer.loadExtension('Autodesk.DataVisualization');
    const pln = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    Autodesk.Extensions.CompGeom.makePlaneBasis(pln);
    const dx = 4;
    const dy = 4;
    const length = Math.sqrt(dx * dx + dy * dy);

    const e = {
        v1: new THREE.Vector2(0, 0),
        dx,
        dy,
        length,
        length2: length * length
    };

    // $ExpectType boolean
    Autodesk.Extensions.CompGeom.pointOnLine(2, 2, e, true, 1e-5);
}

async function dataVizTests(viewer: Autodesk.Viewing.GuiViewer3D): Promise<void> {
    const ext = await viewer.loadExtension('Autodesk.DataVisualization') as Autodesk.Extensions.DataVisualization;
    const heatmapData = new Autodesk.DataVisualization.Core.SurfaceShadingData();
    const level = new Autodesk.DataVisualization.Core.SurfaceShadingGroup('level');
    const room1 = new Autodesk.DataVisualization.Core.SurfaceShadingNode('room1', 2120);

    room1.addPoint(new Autodesk.DataVisualization.Core.SurfaceShadingPoint('sensor1', { x: 10, y: 10, z: 0 }, [ 'temperature' ]));
    level.addChild(room1);
    const room2 = new Autodesk.DataVisualization.Core.SurfaceShadingNode('room2', 2121);

    room2.addPoint(new Autodesk.DataVisualization.Core.SurfaceShadingPoint('sensor2', { x: 20, y: 20, z: 0 }, [ 'temperature' ]));
    level.addChild(room2);
    heatmapData.addChild(level);
    heatmapData.initialize(viewer.model);
    await ext.setupSurfaceShading(viewer.model, heatmapData);
    ext.registerSurfaceShadingColors('temperature', [ 0xff0000, 0x0000ff ]);

    const getSensorValue = (device: any, sensorType: any) => {
        const value = Math.random();

        return value;
    };

    ext.renderSurfaceShading('level', 'temperature', getSensorValue);
}

async function dataVizPlanarTests(viewer: Autodesk.Viewing.GuiViewer3D): Promise<void> {
    const ext = await viewer.loadExtension('Autodesk.DataVisualization') as Autodesk.Extensions.DataVisualization;
    const heatmapData = new Autodesk.DataVisualization.Core.SurfaceShadingData();
    const level = new Autodesk.DataVisualization.Core.SurfaceShadingGroup('level');
    const room1 = new Autodesk.DataVisualization.Core.SurfaceShadingNode('room1', 2120);

    room1.addPoint(new Autodesk.DataVisualization.Core.SurfaceShadingPoint('sensor1', { x: 10, y: 10, z: 0 }, [ 'temperature' ]));
    level.addChild(room1);
    const room2 = new Autodesk.DataVisualization.Core.SurfaceShadingNode('room2', 2121);

    room2.addPoint(new Autodesk.DataVisualization.Core.SurfaceShadingPoint('sensor2', { x: 20, y: 20, z: 0 }, [ 'temperature' ]));
    level.addChild(room2);
    heatmapData.addChild(level);
    heatmapData.initialize(viewer.model);
    await ext.setupSurfaceShading(viewer.model, heatmapData, {
        type: 'PlanarHeatmap'
    });
    ext.registerSurfaceShadingColors('temperature', [ 0xff0000, 0x0000ff ]);

    const getSensorValue = (device: any, sensorType: any) => {
        const value = Math.random();

        return value;
    };

    ext.renderSurfaceShading('level', 'temperature', getSensorValue);
}

function instanceTreeTests(model: Autodesk.Viewing.Model): void {
    const instanceTree = model.getInstanceTree();
    const rootId = instanceTree.getRootId();

    // $ExpectType string
    instanceTree.getNodeName(rootId);
    // $ExpectType boolean
    instanceTree.isNodeHidden(rootId);
    // $ExpectType boolean
    instanceTree.isNodeOff(rootId);
    // $ExpectType boolean
    instanceTree.isNodeSelectable(rootId);
    // $ExpectType boolean
    instanceTree.isNodeSelectionLocked(rootId);
    // $ExpectType boolean
    instanceTree.isNodeVisibleLocked(rootId);
}

function modelTests(model: Autodesk.Viewing.Model): void {
    model.isConsolidated();
    model.isLeaflet();
    model.isOTG();
    model.isPageCoordinates();
    model.isPdf();
    model.isSceneBuilder();
    model.isSVF2();
}

function modelStructurePanelTests(viewer: Autodesk.Viewing.GuiViewer3D): void {
    const options = Autodesk.Viewing.Extensions.generateDefaultViewerHandlerOptions(viewer);
    const panel = new Autodesk.Viewing.Extensions.ViewerModelStructurePanel(options);

    viewer.setModelStructurePanel(panel);
}

async function pixelCompareTests(viewer: Autodesk.Viewing.GuiViewer3D): Promise<void> {
    const ext = await viewer.loadExtension('Autodesk.Viewing.PixelCompare') as Autodesk.Extensions.PixelCompare.PixelCompare;
    const secondDoc = await loadDocument('urn:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6bXktYnVja2V0L215LW90aGVyLWZvcmdlLWZpbGUucnZ0');
    const viewable = secondDoc.getRoot().getDefaultGeometry();
    const secondaryModel = await viewer.loadDocumentNode(secondDoc, viewable, { keepCurrentModels: true });
    const mainModel = viewer.model;

    ext.compareTwoModels(mainModel, secondaryModel);
}

function preferencesTests(viewer: Autodesk.Viewing.GuiViewer3D): void {
    // $ExpectType boolean
    viewer.prefs.alwaysUsePivot;
    // $ExpectType boolean
    viewer.prefs.ambientShadows;
    // $ExpectType boolean
    viewer.prefs.antialiasing;
    // $ExpectType boolean
    viewer.prefs.bimWalkGravity;
    // $ExpectType string
    viewer.prefs.bimWalkNavigatorType;
    // $ExpectType boolean
    viewer.prefs.bimWalkToolPopup;
    // $ExpectType boolean
    viewer.prefs.clickToSetCOI;
    // $ExpectType string
    viewer.prefs.defaultNavigationTool3D;
    // $ExpectType boolean
    viewer.prefs.disablePdfHighlight;
    // $ExpectType boolean
    viewer.prefs.displaySectionHatches;
    // $ExpectType boolean
    viewer.prefs.edgeRendering;
    // $ExpectType boolean
    viewer.prefs.enableCustomOrbitToolCursor;
    // $ExpectType boolean
    viewer.prefs.envMapBackground;
    // $ExpectType string
    viewer.prefs.explodeStrategy;
    // $ExpectType boolean
    viewer.prefs.firstPersonToolPopup;
    // $ExpectType boolean
    viewer.prefs.forceDoubleSided;
    // $ExpectType boolean
    viewer.prefs.forceLeafletCalibration;
    // $ExpectType boolean
    viewer.prefs.forcePDFCalibration;
    // $ExpectType boolean
    viewer.prefs.fusionOrbit;
    // $ExpectType boolean
    viewer.prefs.fusionOrbitConstrained;
    // $ExpectType boolean
    viewer.prefs.ghosting;
    // $ExpectType boolean
    viewer.prefs.grayscale;
    // $ExpectType boolean
    viewer.prefs.groundReflection;
    // $ExpectType boolean
    viewer.prefs.groundShadow;
    // $ExpectType boolean
    viewer.prefs.keyMapCmd;
    // $ExpectType boolean
    viewer.prefs.leftHandedMouseSetup;
    // $ExpectType string
    viewer.prefs.lightPreset;
    // $ExpectType boolean
    viewer.prefs.lineRendering;
    // $ExpectType boolean
    viewer.prefs.loadingAnimation;
    // $ExpectType boolean
    viewer.prefs.openPropertiesOnSelect;
    // $ExpectType boolean
    viewer.prefs.optimizeNavigation;
    // $ExpectType boolean
    viewer.prefs.orbitPastWorldPoles;
    // $ExpectType boolean
    viewer.prefs.pointRendering;
    // $ExpectType boolean
    viewer.prefs.progressiveRendering;
    // $ExpectType boolean
    viewer.prefs.restoreMeasurements;
    // $ExpectType boolean
    viewer.prefs.reverseHorizontalLookDirection;
    // $ExpectType boolean
    viewer.prefs.reverseMouseZoomDir;
    // $ExpectType boolean
    viewer.prefs.reverseVerticalLookDirection;
    // $ExpectType number
    viewer.prefs.selectionMode;
    // $ExpectType boolean
    viewer.prefs.selectionSetsPivot;
    // $ExpectType boolean
    viewer.prefs.swapBlackAndWhite;
    // $ExpectType boolean
    viewer.prefs.useLocalStorage;
    // $ExpectType boolean
    viewer.prefs.viewCube;
    // $ExpectType boolean
    viewer.prefs.viewCubeCompass;
    // $ExpectType number
    viewer.prefs.viewType;
    // $ExpectType boolean
    viewer.prefs.wheelSetsPivot;
    // $ExpectType number
    viewer.prefs.zoomDragSpeed;
    // $ExpectType number
    viewer.prefs.zoomScrollSpeed;
    // $ExpectType boolean
    viewer.prefs.zoomTowardsPivot;
}

function propertyDbTests(model: Autodesk.Viewing.Model): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        function userFunction(pdb: any) {
            const names = [];

            pdb.enumAttributes((i: number, attrDef: any) => {
                names.push(attrDef.displayName);
            });
        }

        model.getPropertyDb().executeUserFunction(userFunction).then((result) => {
            resolve();
        });
    });
}

async function propertyTests(viewer: Autodesk.Viewing.GuiViewer3D): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        viewer.model.getProperties2([ 2120, 2121 ], (results) => {
            resolve();
        }, (err) => {
            reject(err);
        });
    });
}

async function edit2DTests(viewer: Autodesk.Viewing.GuiViewer3D): Promise<void> {
    const ext = await viewer.loadExtension('Autodesk.Edit2D') as Autodesk.Extensions.Edit2D;

    ext.registerDefaultTools();
    // activate polygon tool
    const polyTool = ext.defaultTools.polygonTool;

    viewer.toolController.activateTool(polyTool.getName());
    // boolean operations
    const rectOne = new Autodesk.Edit2D.Polygon();

    rectOne.addPoint(2, 1);
    rectOne.addPoint(-2, 1);
    rectOne.addPoint(-2, -1);
    rectOne.addPoint(2, -1);
    rectOne.addPoint(2, 1);
    const rectTwo = new Autodesk.Edit2D.Polygon();

    rectOne.addPoint(1, 2);
    rectOne.addPoint(-1, 2);
    rectOne.addPoint(-1, -2);
    rectOne.addPoint(1, -2);
    rectOne.addPoint(1, 2);
    // calculate results
    const resIntersect = Autodesk.Edit2D.BooleanOps.apply(rectOne, rectTwo, Autodesk.Edit2D.BooleanOps.Operator.Intersect);
    const resUnion = Autodesk.Edit2D.BooleanOps.apply(rectOne, rectTwo, Autodesk.Edit2D.BooleanOps.Operator.Union);
    const resDifference = Autodesk.Edit2D.BooleanOps.apply(rectOne, rectTwo, Autodesk.Edit2D.BooleanOps.Operator.Difference);
    const resXor = Autodesk.Edit2D.BooleanOps.apply(rectOne, rectTwo, Autodesk.Edit2D.BooleanOps.Operator.Xor);
}

async function extensionTests(viewer: Autodesk.Viewing.GuiViewer3D): Promise<void> {
    const ext = await viewer.loadExtension('Autodesk.Measure');

    // $ExpectType string
    ext.getName();
    const modes = ext.getModes();

    modes.forEach((m) => {
        // $ExpectType boolean
        ext.isActive(m);
    });
}

function fragListTests(model: Autodesk.Viewing.Model): void {
    const fragId = 1; // hard coded value for testing
    const fragList = model.getFragmentList();

    fragList.updateAnimTransform(fragId, undefined, undefined, new THREE.Vector3(10, 10, 10));
    const s = new THREE.Vector3();
    const r = new THREE.Quaternion();
    const t = new THREE.Vector3();

    // $ExpectType boolean
    fragList.getAnimTransform(fragId, s, r, t);
}

function formattingTests(): void {
    // $ExpectType string
    Autodesk.Viewing.Private.formatValueWithUnits(10, Autodesk.Viewing.Private.ModelUnits.CENTIMETER, 3, 2);
}

async function measureTests(viewer: Autodesk.Viewing.GuiViewer3D): Promise<void> {
    const ext = await viewer.loadExtension('Autodesk.Measure') as Autodesk.Extensions.Measure.MeasureExtension;

    ext.sharedMeasureConfig.units = 'in';
    ext.calibrateByScale('in', 0.0254);
    const m = ext.getMeasurementList();

    ext.deleteMeasurements();
    ext.setMeasurements(m);
}

async function searchTests(viewer: Autodesk.Viewing.GuiViewer3D): Promise<number[]> {
    return new Promise<number[]>((resolve, reject) => {
        viewer.model.search('text', (dbIds) => {
            resolve(dbIds);
        }, (err) => {
            reject(err);
        });
    });
}

function showHideTests(viewer: Autodesk.Viewing.GuiViewer3D): void {
    viewer.hideAll();
    viewer.showAll();
}

async function streamLineTests(viewer: Autodesk.Viewing.GuiViewer3D): Promise<void> {
    const ext = await viewer.loadExtension('Autodesk.DataVisualization') as Autodesk.Extensions.DataVisualization;
    const points = [ 10, 10, 10, 20, 20, 20, 30, 30, 30 ];
    const builder = ext.streamLineBuilder;
    const streamLine = builder.createStreamLine({
        lineWidth: 8.0,
        lineColor: new THREE.Color(0xff0080),
        opacity: 1.0,
        lineData: {
            points: new Float32Array(points)
        }
    });

    builder.destroyStreamLine(streamLine);
}

async function stringExtractorTests(viewer: Autodesk.Viewing.GuiViewer3D): Promise<void> {
    const ext = await viewer.loadExtension('Autodesk.StringExtractor') as Autodesk.Extensions.StringExtractor;

    const strings = await ext.getDocumentStrings();
}

async function visualClustersTests(viewer: Autodesk.Viewing.GuiViewer3D): Promise<void> {
    const ext = await viewer.loadExtension('Autodesk.VisualClusters') as Autodesk.Extensions.VisualClusters;

    await ext.setLayoutActive(true);
    ext.reset();
}

function loadDocument(urn: string): Promise<Autodesk.Viewing.Document> {
    return new Promise<Autodesk.Viewing.Document>((resolve, reject) => {
        Autodesk.Viewing.Document.load(urn, (doc) => {
            resolve(doc);
        }, (errorCode, errorMsg) => {
            reject(new Error(errorMsg));
        });
    });
}
