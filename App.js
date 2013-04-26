Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    stateField: 'HomeStates',
    stateValue: 'Cleaned',
    layout: { type: 'hbox' },
    key: 'com.rally.pxs.blueprint',
    items: [
        {xtype:'container',itemId:'story_list',flex:1},
        {xtype:'container',itemId:'drawing_board',flex:3}
    ],
    launch: function() {
        //TODO: recover from preference (with data from table?)
        this._addBlueprint();
        this._getStories();
    },
    _log: function(msg) {
        window.console && console.log( msg );
    },
    _addBlueprint: function() {
        this._log("_addBlueprint");
        this.blueprint = Ext.create('Pxs.Blueprint',{
            width:800,
            height:400,
            listeners: {
                afterdrop: function(bp,sprite) {
                    var options = {};
                    options[this.key] = Ext.JSON.encode({ position_array: bp.getPositions() });
                    this._log(["Saving Setting",options]);
                    this.updateSettingsValues({settings:options});
                },
                scope: this
            }
        });
        this.down('#drawing_board').add(this.blueprint);
    },
    _getStories: function() {
        this._log("_getStories");
        Ext.create('Rally.data.WsapiDataStore',{
            model:'User Story',
            autoLoad: true,
            filters: [{property:this.stateField,operator:'!=',value:""}],
            listeners: {
                load: function(store,data,success) {
                    this._log(["Stories",data]);
                    this._getHistory(store);
                },
                scope: this
            }
        });
    },
    _getHistory: function(store) {
        var me = this;
        Ext.create('Rally.data.lookback.SnapshotStore',{
            autoLoad: true,
            filters: [
                {property:"_TypeHierarchy",value:"HierarchicalRequirement"},
                {property:"c_"+me.stateField,value:me.stateValue},
                {property:"_PreviousValues.c_"+me.stateField,operator:"exists",value:true}
            ],
            sorters: [{property:'ObjectID',direction:'ASC'},{property:"_ValidFrom",direction: 'ASC'}],
            listeners: {
                load: function(snap_store,data,success) {
                    var story_hash = {};
                    Ext.Array.each(store.getRecords(),function(story){
                        story_hash[story.get('ObjectID')] = story;
                    });
                    Ext.Array.each(data,function(snap){
                        if ( story_hash[snap.get('ObjectID')] ) {
                            var age = me._getAge(snap);
                            story_hash[snap.get('ObjectID')].set('Age',age);
                        }
                    });

                    this._showGrid(store);
                },
                scope: this
            }
        });
    },
    _arrangeBySettings: function(blue_print,grid) {
        this._log(["_arrangeBySettings",blue_print,grid]);
        this._log(["settings?",Ext.JSON.decode(this.settings[this.key])]);
        var me = this;
        var settings_object = Ext.JSON.decode(this.settings[this.key]);
        var rowmodel = grid.getView().getSelectionModel();
        if ( settings_object && settings_object.position_array ) {
            Ext.Array.each(settings_object.position_array, function(position) {
                me._log(["ID:", position.id, "Position",position.x, position.y]);
                var item_from_grid = me._getRowFromGrid(position.id,grid);
                blue_print.toggleSprite(rowmodel,item_from_grid.record,item_from_grid.index, position.x,position.y);
            });
            // afterward, make sure the settings are properly saved
            var options = {};
            options[this.key] = Ext.JSON.encode({ position_array: blue_print.getPositions() });
            this._log(["Re-saving Setting",options]);
            this.updateSettingsValues({settings:options});
        }
    },
    _getRowFromGrid: function(object_id,grid){
        var me = this;
        var result = null;
        var index = 0;
        Ext.Array.each(grid.getStore().getRecords(), function(record) {
            //me._log(["comparing",object_id,record.get('ObjectID')]);
            if ( parseInt( record.get('ObjectID') ) === parseInt( object_id ) ) {
                result = { index: index, record: record };
            }
            index++;
        });
        return result;
    },
    _showGrid: function(store) {
        if ( ! this.grid ) {
        this._log(["_showGrid",store.getRecords()]);
            this.grid = Ext.create('Rally.ui.grid.Grid',{
                store: store,
                sortableColumns: false,
                columnCfgs: [ 
                    { text: 'Name', dataIndex: 'Name', flex: 1 },
                    { text: 'Age', dataIndex: 'Age' } 
                ],
                listeners: {
                    select: function(rowmodel,record,index) {
                        this.blueprint.toggleSprite(rowmodel,record,index);
                    },
                    viewready: function(grid) {
                        this._log(["grid ready",grid.getView()]);
                        if ( this.settings && this.blueprint ) {
                            this._arrangeBySettings(this.blueprint,grid);
                        }
                    },
                    scope: this
                }
            });
            this.down('#story_list').add(this.grid);
        }
    },
    _getAge: function(snap) {
        this._log(["_getAge",snap]);
        var today = new Date();
        var snap_date = Rally.util.DateTime.fromIsoString(snap.get('_ValidFrom'));
        return Rally.util.DateTime.getDifference(today,snap_date,'day');
    }
});
