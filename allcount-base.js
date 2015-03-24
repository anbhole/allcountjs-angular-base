var allcountBaseModule = angular.module("allcount-base", []);

allcountBaseModule.factory('track', function () { //TODO
    return function (e) { console.log(e) };
});

allcountBaseModule.factory("lcApi", ["$http", "$q", function ($http, $q) {
    var service = {};

    function castToEntityCrudId(entityCrudId) {
        if (typeof entityCrudId == "string") {
            return {entityTypeId: entityCrudId};
        } else {
            return entityCrudId;
        }
    }

    service.getFieldDescriptions = function (entityCrudId, isGrid, successCallback) {
        if (!entityCrudId) {
            return;
        }
        var httpPromise = $http.get(entityUrl(castToEntityCrudId(entityCrudId), "/field-descriptions", {isGrid: isGrid})).then(getJson).then(function (descriptions) {
            return $(descriptions).map(function (index, item) {
                if (!isGrid || !item.hideInGrid) {
                    return item;
                }
                return undefined;
            })
        });

        if (successCallback) {
            httpPromise.then(successCallback);
        }
        return httpPromise;
    };

    service.permissions = function (entityCrudId, successCallback) {
        if (!entityCrudId) {
            return;
        }
        return promiseWithCallback(
            $http.get(entityUrl(entityCrudId, "/permissions")),
            successCallback
        );
    };

    service.layout = function (entityTypeId, successCallback) {
        if (!entityTypeId) {
            return;
        }
        return promiseWithCallback(
            $http.get(entityUrl({entityTypeId: entityTypeId}, '/layout')),
            successCallback
        );
    };

    service.entityDescription = function (entityTypeId, successCallback) {
        if (!entityTypeId) {
            return;
        }
        return promiseWithCallback(
            $http.get(entityUrl(castToEntityCrudId(entityTypeId), '/entity-description')),
            successCallback
        );
    };

    service.findAll = function (entityCrudId, successCallback) {
        if (!entityCrudId) {
            return;
        }
        return promiseWithCallback(
            $http.get(entityUrl(entityCrudId)),
            successCallback
        );
    };

    function trimFiltering(filtering) { //TODO should be trimmed in control
        if (!filtering) return filtering;
        filtering = angular.copy(filtering);
        filtering.textSearch = filtering.textSearch && filtering.textSearch.length > 0 ? filtering.textSearch : undefined;
        return filtering;
    }

    service.findRange = function (entityCrudId, filtering, start, count, successCallback) {
        if (!entityCrudId) {
            return;
        }
        return promiseWithCallback($http.get(entityUrl(entityCrudId, '', {start: start, count: count, filtering: trimFiltering(filtering)})), successCallback);
    };

    service.findCount = function (entityCrudId, filtering, successCallback) {
        if (!entityCrudId) {
            return;
        }
        return promiseWithCallback($http.get(entityUrl(entityCrudId, '/count', {filtering: trimFiltering(filtering)})), successCallback);
    };

    service.createEntity = function (entityCrudId, entity, successCallback) {
        if (!entityCrudId) {
            return;
        }
        return promiseWithCallback(
            $http.post(entityUrl(entityCrudId), entity),
            successCallback
        );
    };

    service.readEntity = function (entityCrudId, entityId, successCallback) {
        if (!entityCrudId) {
            return;
        }
        return promiseWithCallback(
            $http.get(entityUrl(entityCrudId, '/' +entityId)),
            successCallback
        );
    };

    service.updateEntity = function (entityCrudId, entity, successCallback) {
        if (!entityCrudId) {
            return;
        }
        return promiseWithCallback(
            $http.put(entityUrl(castToEntityCrudId(entityCrudId)), entity),
            successCallback
        );
    };

    service.deleteEntity = function (entityCrudId, entityId, successCallback) {
        if (!entityCrudId) {
            return;
        }
        return promiseWithCallback(
            $http.delete(entityUrl(entityCrudId, '/' + entityId)),
            successCallback
        )
    };

    service.menus = function () {
        return $http.get("/api/menus").then(getJson);
    };

    service.appInfo = function () {
        return $http.get("/api/app-info").then(getJson);
    };

    service.actions = function (entityCrudId, actionTarget) {
        return $http.get(entityUrl(entityCrudId, '/actions', {actionTarget: actionTarget})).then(getJson);
    };

    service.performAction = function (entityCrudId, actionId, selectedItemIds) {
        return $http.post(entityUrl(entityCrudId, '/actions/' + actionId), {selectedItemIds: selectedItemIds}).then(getJson);
    };

    function entityUrl(entityCrudId, suffix, paramsToEncode) {
        var url;
        suffix = suffix || '';
        if (entityCrudId.entityTypeId && _.size(entityCrudId) === 1) {
            url = '/api/entity/' + entityCrudId.entityTypeId + suffix;
        } else {
            url = '/api/entity/crud' + suffix;
            paramsToEncode = paramsToEncode || {};
            paramsToEncode.entityCrudId = entityCrudId;
        }
        var query = _.chain(paramsToEncode).map(function (value, property) {
            if (_.isObject(value)) {
                value = JSON.stringify(value);
            }
            return value != null && (property + "=" + value) || undefined;
        }).filter(_.identity).value().join('&');
        return url + (query.length ? ('?' + query) : '');
    }

    function promiseWithCallback(promise, successCallback) {
        if (successCallback) {
            promise.success(successCallback);
        }
        return promise.then(getJson);
    }

    function getJson(resp) {
        return resp.data;
    }

    service.referenceValueCache = {};

    service.referenceValues = function (entityTypeId, successCallback) {
        if (!entityTypeId) {
            return;
        }
        var promise;
        if (service.referenceValueCache[entityTypeId]) {
            promise = $q.when(service.referenceValueCache[entityTypeId]);
        }
        else {
            promise = $http.get("/api/entity/" + entityTypeId + '/reference-values').then(getJson).then(function (referenceValues) {
                service.referenceValueCache[entityTypeId] = [{id: undefined, name: ""}].concat(referenceValues);
                return service.referenceValueCache[entityTypeId];
            });
        }
        if (successCallback) {
            promise.then(successCallback);
        }
        return promise;
    };

    service.referenceValueByEntityId = function (entityTypeId, entityId) {
        return $http.get("/api/entity/" + entityTypeId + "/reference-values/" + entityId).then(getJson);
    };

    service.signUp = function (username, password) {
        return $http.post('/api/sign-up', {username: username, password: password});
    };

    service.signIn = function (username, password) {
        return $http.post('/api/sign-in', {username: username, password: password}).then(getJson).then(function (resp) {
            localStorage.allcountToken = resp.token;
        });
    };

    service.signOut = function () {
        localStorage.allcountToken = undefined;
    };

    return service;
}]);

allcountBaseModule.directive("lcMenu", menuDirective());
function menuDirective() {
    return ["lcApi", function (rest) {
        return {
            restrict: 'C',
            scope: true,
            link: function (scope, element, attrs) {
                rest.menus().then(function (menuItems) {
                    scope.menuItems = menuItems;
                });

                scope.onlyFirstLevel = function () {
                    if (scope.menuItems) {
                        var onlyFirstLevel = true;
                        $(scope.menuItems).each(function (index, item) {
                            if (item.children && item.children.length > 0) {
                                onlyFirstLevel = false;
                            }
                        });
                        return onlyFirstLevel;
                    }
                    return false;
                }
            }
        }
    }];
}


function handleValidationErrorsCallback(scope) {
    return function onError(err) {
        if (err.status === 403) {
            scope.validationErrors = err.data;
        } else {
            throw err;
        }
    }
}

function listDirective(directiveName, templateUrl) {
    return ["lcApi", "fieldRenderingService", "$parse", "messages", "$q", function (rest, fieldRenderingService, $parse, messages, $q) {
        return {
            restrict: 'A',
            priority: 1100,
            templateUrl: templateUrl,
            scope: true,
            link: function (scope, element, attrs, ctrl) {
                scope.messages = messages;
                scope.atomicCounter = 0;
                scope.filtering = {};
                if (attrs.publishMethods) {
                    var publishMethodsTo = $parse(attrs.publishMethods);
                    publishMethodsTo.assign(scope.$parent, {
                        updateGrid: function () { if (scope.updateGrid) scope.updateGrid() },
                        infiniteScrollLoadNextItems: function () { return scope.infiniteScrollLoadNextItems && scope.infiniteScrollLoadNextItems() },
                        hasWritePermission: function () { return scope.permissions && scope.permissions.write },
                        permissions: function () { return scope.permissions || {} }
                    })
                }

                if (attrs.infiniteScrollEnd) {
                    var infiniteScrollEndSetter = $parse(attrs.infiniteScrollEnd);
                    scope.$watch('infiniteScrollEnd', function (infiniteScrollEnd) {
                        infiniteScrollEndSetter.assign(scope.$parent, infiniteScrollEnd);
                    })
                }

                scope.$parent.$watch(attrs.paging, function (paging) {
                    scope.paging = paging;
                    if (scope.updateGrid) scope.updateGrid();
                }, true);

                scope.$parent.$watch(attrs.totalRow, function (totalRow) { //TODO doubling
                    scope.totalRow = totalRow;
                }, true);

                scope.$parent.$watch(attrs.filtering, function (filtering) {
                    scope.filtering = filtering;
                    if (scope.updateGrid) scope.updateGrid();
                }, true);

                scope.$parent.$watch(attrs[directiveName], function (entityTypeId) {
                    if (typeof entityTypeId == "string")
                        scope.entityCrudId = {entityTypeId: entityTypeId};
                    else
                        scope.entityCrudId = entityTypeId;
                    rest.getFieldDescriptions(scope.entityCrudId, true, function (descriptions) {
                        scope.fieldDescriptions = descriptions;
                        scope.fieldRenderer = {};
                        $(descriptions).each(function (index, desc) {
                            scope.fieldRenderer[desc.field] = fieldRenderingService.readOnlyFieldRenderer(desc);
                        })
                    });

                    scope.permissions = {};
                    rest.permissions(scope.entityCrudId, function (permissions) {
                        scope.permissions = permissions;
                    });

                    scope.updateGrid = function () {
                        if (!scope.paging) return;
                        var next = ++scope.atomicCounter;
                        setTimeout(function () {
                            if (next !== scope.atomicCounter) {
                                return;
                            }
                            if (scope.paging.count === 0) {
                                scope.items = [];
                            } else {
                                rest.findRange(scope.entityCrudId , scope.filtering, scope.paging.start, scope.paging.count, function (items) {
                                    scope.infiniteScrollEnd = false;
                                    scope.items = items
                                })
                            }
                        }, 200);
                    };

                    scope.infiniteScrollLoadNextItems = function () {
                        if (!scope.items) {
                            return $q.when(null);
                        }
                        return rest.findRange(scope.entityCrudId , scope.filtering, scope.paging.start + scope.items.length, scope.paging.count).then(function (items) {
                            if (!items.length) {
                                scope.infiniteScrollEnd = true;
                            }
                            scope.items.push.apply(scope.items, items);
                        });
                    };

                    scope.deleteEntity = function (entity) {
                        function removeEntity() {
                            scope.items.splice(scope.items.indexOf(entity), 1);
                            if (scope.editingItem == entity) {
                                scope.editingItem = undefined;
                            }
                        }
                        if (entity.id) {
                            rest.deleteEntity(scope.entityCrudId, entity.id, removeEntity);
                        } else {
                            removeEntity();
                        }
                    };

                    scope.editEntity = function (entity) {
                        scope.validationErrors = undefined;
                        if (scope.editingItem) {
                            scope.saveEntity(function () {});
                        }

                        scope.originalEntity = angular.copy(entity);
                        scope.editingItem = entity;
                    };

                    scope.navigate = function (entityId) {
                        if (attrs.navigate) {
                            scope.$parent.$eval(attrs.navigate, {$entityId: entityId});
                        }
                    };

                    scope.hasNavigate = !!attrs.navigate;

                    scope.headerClass = function (fd) {
                        var cls = {};
                        cls[fd.fieldTypeId + '-grid-header'] = true;
                        return cls;
                    };

                    scope.saveEntity = function (success) {
                        var entity = scope.editingItem;
                        function onSuccess(id) {
                            scope.validationErrors = undefined;
                            if (!entity.id) {
                                entity.id = id;
                            }
                            if (success) {
                                success();
                            } else {
                                scope.editingItem = undefined;
                            }
                        }
                        if (scope.editingItem.id) {
                            rest.updateEntity(scope.entityCrudId, scope.entityForUpdate()).then(onSuccess, handleValidationErrorsCallback(scope));
                        } else {
                            rest.createEntity(scope.entityCrudId, entity).then(onSuccess, handleValidationErrorsCallback(scope));
                        }
                    };

                    scope.createEntity = function () {
                        var item = {};
                        scope.items.push(item);
                        scope.editEntity(item);
                    };

                    scope.entityForUpdate = function () { //TODO doubling
                        var forUpdate = {id: scope.editingItem.id};
                        for (var field in scope.editingItem) {
                            if (scope.editingItem.hasOwnProperty(field) && scope.isFieldChanged(field)) {
                                forUpdate[field] = scope.editingItem[field] ? scope.editingItem[field] : null;
                            }
                        }
                        return forUpdate;
                    };

                    scope.isFieldChanged = function (field) { //TODO doubling
                        return scope.editingItem && scope.originalEntity && !angular.equals(scope.editingItem[field], scope.originalEntity[field])
                    };

                    scope.updateGrid();
                });

                if (attrs.editMode)
                    scope.$parent.$watch(attrs.editMode, function (value) {
                        scope.isInEditMode = value;
                        if (!scope.isInEditMode) {
                            scope.editEntity(undefined);
                        }
                    })
            }
        }
    }]
}

allcountBaseModule.directive("lcList", listDirective('lcList'));

allcountBaseModule.provider('fieldRenderingService', function () {

    var fieldIdToRendererFactories = [];
    var layoutRendererFactories = [];
    var staticTemplateFn = ["$compile", function ($compile) {
        return function (value, fieldScope) {
            var elem;
            if (value instanceof jQuery) {
                elem = $compile('<div class="form-control-static"></div>')(fieldScope);
                elem.append(value);
            } else {
                fieldScope.renderedText = value || '';
                elem = $compile('<div class="form-control-static">{{renderedText}}</div>')(fieldScope);
            }
            return elem;
        }
    }];

    this.defineFields = function (fieldIdToRendererFactory) {
        fieldIdToRendererFactories.push(fieldIdToRendererFactory);
    };

    this.defineLayoutRenderers = function (containerIdToRendererFactory) {
        layoutRendererFactories.push(containerIdToRendererFactory);
    };

    this.setFormStaticTemplate = function (staticTemplateFactory) {
        staticTemplateFn = staticTemplateFactory;
    };

    this.$get = ["$injector", function ($injector) {
        var layoutRenderers = {};
        var fieldRenderers = {};
        var fieldEditors = {};
        var formStaticTemplate = $injector.invoke(staticTemplateFn);

        _.chain(fieldIdToRendererFactories).map(function (factory) {
            return $injector.invoke(factory);
        }).forEach(function (fieldIdToRenderFactories) {
            _.forEach(fieldIdToRenderFactories, function (rendererAndEditor, fieldId) {
                fieldRenderers[fieldId] = rendererAndEditor[0];
                fieldEditors[fieldId] = rendererAndEditor[1];
            })
        });

        _.chain(layoutRendererFactories).map(function (factory) {
            return $injector.invoke(factory);
        }).forEach(function (containerIdToRenderer) {
            _.extend(layoutRenderers, containerIdToRenderer);
        });

        var service = {};

        service.readOnlyFieldRenderer = function (fieldDescription) {
            return fieldRenderers[fieldDescription.fieldTypeId] && function (value) {
                    return fieldRenderers[fieldDescription.fieldTypeId](value, fieldDescription);
                } || fieldRenderers[fieldDescription.fieldTypeId];
        };

        service.fieldEditor = function (fieldDescription, controller, updateValue, clone, scope) {
            return fieldEditors[fieldDescription.fieldTypeId](fieldDescription, controller, updateValue, clone, scope);
        };

        service.layoutRenderer = function (containerId, params, children, childrenObjs) {
            return layoutRenderers[containerId](params, children, childrenObjs);
        };

        service.formStaticWrap = function (value, fieldScope) {
            return formStaticTemplate(value, fieldScope);
        };

        return service;
    }];
});

allcountBaseModule.factory("messages", [function () {
    return function (msg) { //TODO
        return msg;
    };
}]);

function fieldDirective(directiveName) {
    return ["lcApi", "fieldRenderingService", "$compile", function (rest, fieldRenderingService, $compile) {
        return {
            restrict: 'A',
            require: 'ngModel',
            scope: false,
            transclude: true, //TODO angular doesn't permit to use ngModel on transclude 'element' -- it tries to set classes to it. Need to redesign field rendering?
            link: function (scope, element, attrs, controller, transclude) {
                var fieldElement, fieldScope;

                function setFieldElement(elem) {
                    if (fieldElement) {
                        fieldElement.remove();
                        fieldElement = undefined;
                    }
                    if (elem) {
                        elem = $(elem);
                        element.after(elem);
                        fieldElement = elem;
                    }
                }

                function updateValue(value) {
                    scope.$apply(function () {
                        controller.$setViewValue(value);
                    })
                }

                function renderField(fieldDescription, isEditor) {
                    if (!fieldDescription || fieldRenderingService.readOnlyFieldRenderer(fieldDescription) === false && fieldScope) {
                        if (fieldScope) {
                            fieldScope.isEditor = isEditor;
                        }
                        return;
                    }
                    if (fieldScope) fieldScope.$destroy();
                    if (!fieldDescription) return;
                    isEditor = fieldDescription.isReadOnly ? false : isEditor;
                    fieldScope = scope.$new();
                    if (isEditor || fieldRenderingService.readOnlyFieldRenderer(fieldDescription) === false) {
                        fieldScope.isEditor = isEditor;
                        controller.$render = function () {
                            transclude(scope, function (clone) { //TODO what scope for transclude?
                                setFieldElement(fieldRenderingService.fieldEditor(fieldDescription, controller, updateValue, clone, fieldScope));
                            });
                        };
                    } else {
                        controller.$render = function () {
                            var value = fieldRenderingService.readOnlyFieldRenderer(fieldDescription)(controller.$viewValue);
                            setFieldElement(fieldRenderingService.formStaticWrap(value, fieldScope));
                        }
                    }
                    controller.$render();
                }

                scope.$watch(attrs.isEditor, function (isEditor) {
                    renderField(scope.$eval(attrs[directiveName]), isEditor);
                });
                scope.$watch(attrs[directiveName], function (fd) {
                    renderField(fd, scope.$eval(attrs.isEditor));
                })
            }
        }
    }];
}
allcountBaseModule.directive("lcField", fieldDirective("lcField"));

allcountBaseModule.directive("lcForm", ["lcApi", "fieldRenderingService", "$parse", function (rest, fieldRenderingService, $parse) {
    return {
        restrict: 'A',
        scope: true,
        link: function (scope, element, attrs) {
            scope.entity = {}; //TODO should be filled by entity or template
            scope.$watch(attrs.lcForm, function (entityTypeId) {
                if (typeof entityTypeId == "string") {
                    scope.entityCrudId = {entityTypeId: entityTypeId};
                    scope.entityTypeId = entityTypeId;
                } else {
                    scope.entityCrudId = entityTypeId;
                }
                scope.reloadEntity = function (successCallback) {
                    if (attrs.entity && scope.$parent.$eval(attrs.entity)) {
                        scope.entity = scope.$parent.$eval(attrs.entity);
                    } else {
                        scope.entity = {}; //TODO should be filled by entity or template
                        var entityId = scope.$parent.$eval(attrs.entityId);
                        if (!entityId) return;
                        rest.readEntity(scope.entityCrudId, entityId, function (entity) {
                            scope.entity = entity;
                            scope.originalEntity = angular.copy(entity);
                            if (successCallback) successCallback();
                        })
                    }
                };

                scope.$watch('entity', function (entity, oldEntity) {
                    for (var field in scope.fieldToDesc) {
                        if (scope.fieldToDesc.hasOwnProperty(field) && entity && oldEntity &&
                            !angular.equals(entity[field], oldEntity[field]) && scope.validationErrors) {
                            scope.validationErrors[field] = undefined;
                        }
                    }
                }, true);

                scope.createEntity = function (successCallback) {
                    return rest.createEntity(scope.entityCrudId, scope.entity).then(function () {
                        scope.validationErrors = undefined;
                        successCallback && successCallback();
                    }, handleValidationErrorsCallback(scope))
                };

                scope.updateEntity = function (successCallback) {
                    return rest.updateEntity(scope.entityCrudId, scope.entityForUpdate()).then(function () { //TODO send only difference with original entity
                        scope.validationErrors = undefined;
                        if (successCallback) successCallback();
                    }, handleValidationErrorsCallback(scope))
                };

                scope.deleteEntity = function (successCallback) {
                    return rest.deleteEntity(scope.entityCrudId, scope.entity.id).then(function () {
                        if (successCallback) successCallback();
                    });
                };

                scope.entityForUpdate = function () {
                    var forUpdate = {id: scope.entity.id};
                    for (var field in scope.entity) {
                        if (scope.entity.hasOwnProperty(field) && scope.isFieldChanged(field)) {
                            forUpdate[field] = scope.entity[field] ? scope.entity[field] : null;
                        }
                    }
                    return forUpdate;
                };

                scope.isFieldChanged = function (field) {
                    return scope.entity && scope.originalEntity && !angular.equals(scope.entity[field], scope.originalEntity[field])
                };

                if (attrs.publishMethods) {
                    var publishMethodsTo = $parse(attrs.publishMethods);
                    publishMethodsTo.assign(scope.$parent, {
                        createEntity: scope.createEntity,
                        updateEntity: scope.updateEntity,
                        deleteEntity: scope.deleteEntity,
                        reloadEntity: scope.reloadEntity,
                        entity: function () { return scope.entity },
                        fieldToDescription: function () { return scope.fieldToDesc }
                    })
                }

                rest.getFieldDescriptions(scope.entityCrudId, false, function (descriptions) { //TODO doubling
                    scope.fieldDescriptions = descriptions;
                    scope.fieldRenderer = {};
                    scope.fieldToDesc = {};
                    $(descriptions).each(function (index, desc) {
                        scope.fieldRenderer[desc.field] = fieldRenderingService.readOnlyFieldRenderer(desc);
                        scope.fieldToDesc[desc.field] = desc;
                    })
                });

                scope.showLabel = function (field) {
                    return scope.fieldToDesc && scope.fieldToDesc[field] && !scope.fieldToDesc[field].fieldType.removeFormLabel;
                };

                scope.reloadEntity();
            });

            attrs.isEditor && scope.$parent.$watch(attrs.isEditor, function (isEditor) {
                scope.isEditor = isEditor;
            });

            if (attrs.entityId)
                scope.$parent.$watch(attrs.entityId, function (newEntityId) {
                    if (scope.reloadEntity) scope.reloadEntity();
                });
        }
    }
}]);

function messageDirective(directiveName) {
    return ["messages", function (messages) {
        return {
            restrict: 'A',
            scope: false,
            link: function (scope, element, attrs) {
                attrs.$observe(directiveName, function (messageValue) {
                    $(element).text(messages(messageValue));
                });
            }
        }
    }];
}

allcountBaseModule.directive("lcMessage", messageDirective("lcMessage"));