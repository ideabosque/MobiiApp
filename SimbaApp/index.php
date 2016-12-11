<!DOCTYPE html>
<!-- html manifest="simbaapp.manifest" -->
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <!-- meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0; minimum-scale=1.0; user-scalable=0;" / -->
    <link rel="stylesheet" href="resources/css/simba.css" type="text/css">
    <link rel="stylesheet" href="resources/css/gridpanel.css" type="text/css">
    <link rel="stylesheet" href="resources/css/touch-charts.css" type="text/css">
	<style type="text/css">
         /**
         * Example of an initial loading indicator.
         * It is recommended to keep this as minimal as possible to provide instant feedback
         * while other resources are still being loaded for the first time
         */
        html, body {
            height: 100%;
            background-color: black /* #1985D0*/
        }

        #appLoadingIndicator {
            position: absolute;
            top: 50%;
            margin-top: -15px;
            text-align: center;
            width: 100%;
            height: 30px;
            -webkit-animation-name: appLoadingIndicator;
            -webkit-animation-duration: 0.5s;
            -webkit-animation-iteration-count: infinite;
            -webkit-animation-direction: linear;
        }

        #appLoadingIndicator > * {
            background-color: #FFFFFF;
            display: inline-block;
            height: 30px;
            -webkit-border-radius: 15px;
            margin: 0 5px;
            width: 30px;
            opacity: 0.8;
        }

        @-webkit-keyframes appLoadingIndicator{
            0% {
                opacity: 0.8
            }
            50% {
                opacity: 0
            }
            100% {
                opacity: 0.8
            }
        }
    </style>
    <title>MobiiApp Web</title>
	<script type="text/javascript" src="https://maps.google.com/maps/api/js?sensor=true"></script>
    <script type="text/javascript" src="sencha-touch-debug.js"></script>
    <script type="text/javascript" src="touch-charts.js"></script>
    
    <!-- Application Registration -->
    <script type="text/javascript" src="app/app.js"></script>
    
    <!-- Plugins-->
    <script type="text/javascript" src="app/plugins/Ext.form.ux.touch.MultiSelect.js"></script>
    <script type="text/javascript" src="app/plugins/Ext.form.ux.touch.ColorPickerField.js"></script>
	<script type="text/javascript" src="app/plugins/Ext.ux.DimGridPanel.js"></script>
	<script type="text/javascript" src="app/plugins/Ext.ux.FactGridPanel.js"></script>
	<script type="text/javascript" src="app/plugins/Ext.ux.SimbaStore.js"></script>
	<script type="text/javascript" src="app/plugins/Ext.ux.ImageViewer.js"></script>
	<script type="text/javascript" src="app/plugins/markercluster.js"></script>
    
    <!-- Models and Stores -->
    <script type="text/javascript" src="app/models/models.js"></script>
    <script type="text/javascript" src="app/stores/stores.js"></script>

    <!-- Main Viewport -->
    <script type="text/javascript" src="app/views/LoginForm.js"></script>
    <script type="text/javascript" src="app/views/Viewport.js"></script>
    <script type="text/javascript" src="app/views/OfflineView.js"></script>
    
    <!-- Nested Navigation--> 
    <script type="text/javascript" src="app/views/Navigation.js"></script>
	
	<!-- Simba Views -->
     <script type="text/javascript" src="app/views/SimbaPage.js"></script>
     <script type="text/javascript" src="app/views/SimbaReport.js"></script>
     <script type="text/javascript" src="app/views/SimbaTable.js"></script>
     <script type="text/javascript" src="app/views/SimbaPivotTable.js"></script>
     <script type="text/javascript" src="app/views/SimbaChart.js"></script>
	 <script type="text/javascript" src="app/views/SimbaMap.js"></script>
	 <script type="text/javascript" src="app/views/SimbaReportEditor.js"></script>
	 <script type="text/javascript" src="app/views/Support.js"></script>

    
</head>
<body>
	<div id="appLoadingIndicator">
        <div></div>
        <div></div>
        <div></div>
    </div>
</body>
</html>
<?php  ?>
